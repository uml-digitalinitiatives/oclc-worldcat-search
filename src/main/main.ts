/* eslint global-require: off, no-console: off, no-param-reassign: ["error", { "props": false }] */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app, BrowserWindow, shell, ipcMain, dialog,
} from 'electron';
import log from 'electron-log';
import ElectronStore from 'electron-store';
import axios from 'axios';
import { createFileRoute } from 'electron-router-dom';
import { updateElectronApp } from 'update-electron-app';
import * as XLSX from 'xlsx';
import MenuBuilder from './menu';
import { challengeFromVerifier, generateRandomString, resolveHtmlPath } from './util';
import { BriefRecordInterface, DiscoveryQuery } from '../renderer/interfaces/oclc_interfaces';
import { TokenType } from './constants_types';

const fs = require('fs');

const Store = require('electron-store');

const store: ElectronStore = new Store();

const THIRD_PARTY_LOGIN_URL = 'https://oauth.oclc.org/auth/65586?response_type=code&scope=wcapi%3Aview_institution_holdings%20refresh_token'; // Default to U of M
const OAUTH_PKCE_LOGIN_URL = new URL(THIRD_PARTY_LOGIN_URL);

const FAKE_REDIRECT_URL = 'http://127.0.0.1:9999/oauthcallback/';
const APP_CLIENT_WSKEY = 'VO2qsUtIWQHI7N39EIKblovaTb1Yjh2VVGN5IXfTlzMp9jcdKEGSQ5d16EcNiVfRjYPBU5LPI6bhqnnl';
const OCLC_OAUTH_ACCESS_TOKEN_ARG = 'oclc_oauth_token'; // key for the OCLC OAuth access token
const OCLC_ACCESS_TOKEN_URL = 'https://oauth.oclc.org/token';
const OAUTH_ACCESS_TOKEN_URL = new URL(OCLC_ACCESS_TOKEN_URL);
const OCLC_SEARCH_URL = 'https://americas.discovery.api.oclc.org/worldcat/search/v2';
const OCLC_BIB_HOLDINGS_URL = `${OCLC_SEARCH_URL}/bibs-holdings`;

let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null; // Window for OAuth
const searchAxios = axios.create();
const refreshTokenAxios = axios.create();

// Handle javascript source maps in production
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

/**
 * Install developer extensions.
 */
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

/**
 * Configure log settings.
 */
const setupLog = () => {
  log.transports.file.resolvePath = () => path.join(app.getPath('logs'), 'main.log');
  log.transports.file.level = 'info';
};

/**
 * Create the main window.
 */
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => path.join(RESOURCES_PATH, ...paths);

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
  log.info(`devPath: ${devPath}`);
  const [prodPath] = createFileRoute(
    `file://${path.join('../dist/renderer/', 'index.html')}`,
    '',
  );
  log.info(`prodPath: ${prodPath}`);
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
  updateElectronApp();
};

/**
 * Create the OAuth window.
 */
const createAuthWindow = async () => {
  if (authWindow !== null) {
    authWindow.destroy();
  }
  authWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
    },
  });

  const {
    session: { webRequest },
  } = authWindow.webContents;
  const filter = { urls: [`${FAKE_REDIRECT_URL}*`] };

  // Add the redirect URL to the OAuth URL
  OAUTH_PKCE_LOGIN_URL.searchParams.set(
    'redirect_uri',
    FAKE_REDIRECT_URL,
  );
  // Add the client ID to the OAuth URL
  OAUTH_PKCE_LOGIN_URL.searchParams.set(
    'client_id',
    APP_CLIENT_WSKEY,
  );
  // Generate a code verifier and challenge
  const codeVerifier = generateRandomString();

  const challenge = await challengeFromVerifier(codeVerifier);

  OAUTH_PKCE_LOGIN_URL.searchParams.set(
    'code_challenge',
    challenge,
  );
  OAUTH_PKCE_LOGIN_URL.searchParams.set(
    'code_challenge_method',
    'S256',
  );

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    // Filter for fake redirect URL and capture the request.
    const parsedUrl = new URL(url);
    authWindow?.close();
    const code = parsedUrl.searchParams.get('code');
    if (!code) {
      console.error(`No code, received: ${parsedUrl.search}`);
      throw new Error('No code returned from OAuth');
    }
    const params = {
      grant_type: 'authorization_code',
      code,
      client_id: APP_CLIENT_WSKEY,
      redirect_uri: FAKE_REDIRECT_URL,
      code_verifier: codeVerifier,
    };
    axios.post(OCLC_ACCESS_TOKEN_URL, null, {
      headers: {
        Accept: 'application/json',
      },
      params,
    }).then((response) => {
      console.log(response.data);
      if (response.status === 200) {
        store.set(OCLC_OAUTH_ACCESS_TOKEN_ARG, response.data);
        console.log({
          access_token: response.data.access_token,
          expires_at: response.data.expires_at,
        });
      } else {
        console.error(`Error getting access token: ${response.statusText}`);
      }
    }).catch((error) => {
      console.error(error);
      if (error.response) {
        console.error(error.response.data);
      }
    });
  });
  authWindow?.loadURL(OAUTH_PKCE_LOGIN_URL.toString());
};

/**
 * Refresh the access token.
 * @param refresh_token The refresh token to use.
 * @returns The new access token if successful, null otherwise.
 */
const refreshToken = async (refresh_token: string): Promise<TokenType> => {
  const params = {
    grant_type: 'refresh_token',
    refresh_token,
    client_id: APP_CLIENT_WSKEY,
  };
  return refreshTokenAxios.post(OAUTH_ACCESS_TOKEN_URL.toString(), null, {
    params,
    headers: {
      Accept: 'application/json',
    },
  }).then((response) => {
    if (response.status === 200) {
      store.set(OCLC_OAUTH_ACCESS_TOKEN_ARG, response.data);
      return response.data;
    }
    throw new Error(`Error refreshing token: ${response.statusText}`);
  });
};

/**
 * Get the access token.
 * @param doLogin Whether to log in if not already logged in.
 * @returns The access token if logged in, null otherwise.
 */
const getAccessToken = async (doLogin: boolean = false): Promise<TokenType | null> => {
  const token = store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType | null;
  if (token === null) {
    if (doLogin) {
      createAuthWindow();
      return store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType | null;
    }
    return null;
  } if (Date.parse(token.expires_at) > Date.now()) {
    return token;
  } if (Date.parse(token.refresh_token_expires_at) > Date.now()) {
    const newToken = await refreshToken(token.refresh_token).catch((error) => {
      console.error(error);
      return null;
    });
    return newToken;
  }
  if (doLogin) {
    createAuthWindow();
    return store.get(OCLC_OAUTH_ACCESS_TOKEN_ARG, null) as TokenType | null;
  }
  return null;
};

/**
 * Check if the user is logged in.
 * @param doLogin Whether to log in if not already logged in.
 * @returns True if logged in, false otherwise.
 */
const isLoggedIn = async (doLogin: boolean = false): Promise<boolean> => {
  const token: TokenType | null = await getAccessToken(doLogin);
  if (token === null) {
    return false;
  }
  return true;
};

/**
 * Setup Axios interceptors.
 */
searchAxios.interceptors.response.use((response) => response, async (error) => {
  if (error.response) {
    if ((
      error.response.status === 403
      && error.response.data?.Message === 'User is not authorized to access this resource with an explicit deny'
    )
      || error.response.status === 401
    ) {
      console.error('Access token expired');
      const token = await getAccessToken();
      if (token === null) {
        return Promise.reject(error);
      }
      const newToken = await refreshToken(token.refresh_token);
      error.config.headers.Authorization = `Bearer ${newToken.access_token}`;
      // Retry the original request
      return searchAxios(error.config);
    }
    console.error(error.response.data);
  } else {
    console.error(error);
  }
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});

/**
 * Do a WorldCat search using the OCLC Discovery API.
 * @param query A JSON string representing a DiscoveryQuery object.
 * @returns A response JSON object from the OCLC API.
 */
const doSearch = async (query: string) => {
  const token = await getAccessToken(true);
  if (token === null) {
    throw new Error('Not logged in');
  }
  console.log(`Access token: ${token.access_token}`);

  const dq: DiscoveryQuery = DiscoveryQuery.fromJSON(query);

  return searchAxios.get(OCLC_BIB_HOLDINGS_URL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/json',
    },
    params: dq.toSearchString(),
  }).then((response) => {
    if (response.status !== 200) {
      console.error(response.data);
      throw new Error(`Error searching: ${response.statusText}`);
    } else {
      return response.data;
    }
  });
};

/**
 * Do a search for bibliographic holdings using the OCLC Discovery API.
 * @param query A JSON string representing a DiscoveryQuery object.
 * @returns An array of BriefRecordInterface objects.
 */
const getBibHoldings = async (query: string, mmsId: string = ''): Promise<Array<BriefRecordInterface>> => await doSearch(query).then((data) => {
  const records: Array<BriefRecordInterface> = [];
  if (data.numberOfRecords > 0) {
    data.briefRecords.forEach((record: BriefRecordInterface) => records.push({ ...record, mmsId }));
  }
  return records;
}).catch((error) => {
  if (error.response && error.response.data) {
    if (error.response.data.detail) {
      throw new Error(`${error.message}: ${error.response.data.detail}`);
    } else if (error.response.data.Message) {
      throw new Error(`${error.message}: ${error.response.data.Message}`);
    } else if (error.response.data.message) {
      throw new Error(`${error.message}: ${error.response.data.message}`);
    } else {
      throw new Error(`${error.message}: ${error.response.data}`);
    }
  }
}) as Array<BriefRecordInterface>;

/**
 * Write a XLSX WorkSheet object to a file.
 * @param file The worksheet to write to a file as array of array of strings.
 * @returns The name of the file written, undefined if cancelled.
 */
const exportFile = async (file: string[][]): Promise<string | undefined> => new Promise(
  (resolve, reject) => {
    const newSheet = XLSX.utils.aoa_to_sheet(file);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, newSheet, 'Sheet1');
    dialog.showSaveDialog({
      title: 'Save file as',
      filters: [{
        name: 'Excel Spreadsheets',
        extensions: ['xlsx', 'xls'],
      }],
    }).then((result) => {
      if (result.canceled) {
        resolve(undefined);
      }
      try {
        fs.writeFileSync(result.filePath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
        resolve(result.filePath);
      } catch (err) {
        reject(err);
      }
    }).catch((err) => {
      reject(err);
    });
  },
);

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

/**
 * When ready actions.
 */
app
  .whenReady()
  .then(() => {
    ipcMain.on('store:set', async (event, key, value) => { // eslint-disable-line no-unused-vars
      await store.set(key, value);
    });
    ipcMain.handle('store:get', async (
      event, // eslint-disable-line no-unused-vars
      key,
    ) => store.get(key));
    ipcMain.handle('file:export', async (
      event, // eslint-disable-line no-unused-vars
      file: string[][],
    ): Promise<string | undefined> => exportFile(file));
    ipcMain.handle('oclc:getBibHoldings', async (
      event, // eslint-disable-line no-unused-vars
      query: string,
      mmsId: string = '',
    ) => isLoggedIn(true).then(() => getBibHoldings(query, mmsId)));
    ipcMain.handle('auth:isLoggedIn', async (): Promise<boolean> => isLoggedIn());
    ipcMain.handle('auth:login', async (): Promise<void> => {
      if (await isLoggedIn(true) === false) {
        createAuthWindow();
      }
    });
    ipcMain.on('auth:logout', async (): Promise<void> => {
      store.delete(OCLC_OAUTH_ACCESS_TOKEN_ARG);
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
