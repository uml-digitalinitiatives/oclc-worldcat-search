/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import log from 'electron-log';
import ElectronStore from 'electron-store';
import MenuBuilder from './menu';
import { challenge_from_verifier, generateRandomString, resolveHtmlPath } from './util';
import { exportFile, getBibHoldings } from './backend_actions';
import axios from 'axios';
import { TokenType } from './constants_types';
import { createFileRoute } from 'electron-router-dom';
import { autoUpdater } from 'electron-updater';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = "debug"
    autoUpdater.logger = log
    autoUpdater.autoDownload = true;
    autoUpdater.on('checking-for-update', function () {
      console.log('Checking for update...');
    });

    autoUpdater.on('error', function (err) {
      console.log('AppUpdater Error in auto-updater: ' + err.message);
    });

    autoUpdater.checkForUpdatesAndNotify()
  }
}

const Store = require('electron-store');
const store: ElectronStore = new Store();

const THIRD_PARTY_LOGIN_URL = "https://oauth.oclc.org/auth/65586?response_type=code&scope=wcapi%3Aview_institution_holdings%20refresh_token"; // Default to U of M
const oauth_pkce_login_url = new URL(THIRD_PARTY_LOGIN_URL);

const FAKE_REDIRECT_URL = "http://127.0.0.1:9999/oauthcallback/";
const APP_CLIENT_WSKEY = 'VO2qsUtIWQHI7N39EIKblovaTb1Yjh2VVGN5IXfTlzMp9jcdKEGSQ5d16EcNiVfRjYPBU5LPI6bhqnnl';
const OCLC_OAUTH_ACCESS_TOKEN_ARG = "oclc_oauth_token"; // key for the OCLC OAuth access token
const OCLC_ACCESS_TOKEN_URL = "https://oauth.oclc.org/token";
const oauth_access_token_url = new URL(OCLC_ACCESS_TOKEN_URL);

let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null; // Window for OAuth

// Handle javascript source maps in production
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

// Install developer extensions.
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

// Configure log settings.
const setupLog = () => {
  log.transports.file.resolvePath = () => path.join(app.getPath('logs'), 'main.log');
  log.transports.file.level = 'info';
};

// Create the main window.
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    useContentSize: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  const devPath = resolveHtmlPath('index.html', '');
  log.info("devPath: " + devPath);
  const [prodPath, prodLoadOptions] = createFileRoute(
    `file://${path.join('../dist/renderer/', 'index.html')}`,
    ''
  )
  log.info("prodPath: " + prodPath);
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devPath);
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // App auto-updater
  new AppUpdater();
};

// Create the OAuth window.
const createAuthWindow = async () => {
  if (authWindow !== null) {
    authWindow.destroy();
  }
  authWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: false,
    }
  });

  const {
    session: { webRequest },
  } = authWindow.webContents;
  const filter = { urls: [FAKE_REDIRECT_URL + "*"] };

  // Add the redirect URL to the OAuth URL
  oauth_pkce_login_url.searchParams.set(
    "redirect_uri",
    FAKE_REDIRECT_URL);
  // Add the client ID to the OAuth URL
  oauth_pkce_login_url.searchParams.set(
    "client_id",
    APP_CLIENT_WSKEY
  );
  // Generate a code verifier and challenge
  const code_verifier = generateRandomString();

  const challenge = await challenge_from_verifier(code_verifier).then((challenge) => {return challenge}).catch((error) => {console.error(error); return '';});

  oauth_pkce_login_url.searchParams.set(
    'code_challenge',
    challenge
  );
  oauth_pkce_login_url.searchParams.set(
    'code_challenge_method',
    'S256'
  );

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    // Filter for fake redirect URL and capture the request.
    const parsedUrl = new URL(url);
    authWindow?.close();
    const code = parsedUrl.searchParams.get("code");
    if (!code) {
      console.error("No code, received: " + parsedUrl.search);
      throw new Error("No code returned from OAuth");
    }
    const params = {
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': APP_CLIENT_WSKEY,
      'redirect_uri': FAKE_REDIRECT_URL,
      'code_verifier': code_verifier,
    }
    axios.post(OCLC_ACCESS_TOKEN_URL, null, {
      headers : {
        'Accept': 'application/json',
      },
      params: params
    }).then((response) => {
      console.log(response.data);
      if (response.status === 200) {
        store.set(OCLC_OAUTH_ACCESS_TOKEN_ARG, response.data);
        console.log({"access_token": response.data.access_token, "expires_at": response.data.expires_at});
      } else {
        console.error("Error getting access token: " + response.statusText);
      }
    }).catch((error) => {
      console.error(error);
      if (error.response) {
        console.error(error.response.data);
      }
    });
  });
  authWindow?.loadURL(oauth_pkce_login_url.toString());
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When ready actions.
app
  .whenReady()
  .then(() => {
    ipcMain.on('store:set', async (event, key, value) => {
      await store.set(key, value);
    });
    ipcMain.handle('store:get', async (event, key) => {
      return store.get(key);
    });
    ipcMain.handle('file:export', async (event, file: string[][]): Promise<string|undefined> => {
      return await exportFile(file);
    });
    ipcMain.handle('oclc:getBibHoldings', async (event, query: string, mmsId: string = '') => {
      await isLoggedIn(true); // Check we are still logged in, and log in if not
      return await getBibHoldings(query, mmsId); // Do the query.
    });
    ipcMain.handle('auth:isLoggedIn', async (event): Promise<boolean> => {
      return await isLoggedIn();
    });
    ipcMain.handle('auth:login', async (event): Promise<void> => {
      if (await isLoggedIn(true) === false) {
        createAuthWindow();
      }
    });

    setupLog();
  
    createWindow();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

/**
 * Check if the user is logged in.
 * @param doLogin Whether to log in if not already logged in.
 * @returns True if logged in, false otherwise.
 */
export const isLoggedIn = async (doLogin: boolean = false): Promise<boolean> => {
  const token: TokenType|null = await getAccessToken(doLogin);
  if (token === null) {
    return false;
  } else {
    return true;
  }
};

/**
 * Get the access token.
 * @param doLogin Whether to log in if not already logged in.
 * @returns The access token if logged in, null otherwise.
 */
export const getAccessToken = async (doLogin: boolean = false): Promise<TokenType|null> => {
  const token = store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType|null;
  if (token === null) {
    if (doLogin) {
      createAuthWindow();
      return store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType|null;
    }
    return null;
  } else if (Date.parse(token.expires_at) > Date.now()) {
    return token;
  } else if (Date.parse(token.refresh_token_expires_at) > Date.now()) {
    return refreshToken(token.refresh_token).then((token) => {
      store.set(OCLC_OAUTH_ACCESS_TOKEN_ARG, token);
      return token;
    }).catch((error) => {
      console.error(error);
      return null;
    });
  } else {
    if (doLogin) {
      createAuthWindow();
      return store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType|null;
    }
    return null;
  }
}

/**
 * Refresh the access token.
 * @param refresh_token The refresh token to use.
 * @returns The new access token if successful, null otherwise.
 */
const refreshToken = async (refresh_token: string): Promise<TokenType> => {
  const params = {
    'grant_type': 'refresh_token',
    'refresh_token': refresh_token,
    'client_id': APP_CLIENT_WSKEY,
  }
  return await axios.post(oauth_access_token_url.toString(), null, {
    params: params,
    headers: {
      'Accept': 'application/json',
    }
  }).then((response) => {
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Error refreshing token: " + response.statusText);
    }
  });
};
