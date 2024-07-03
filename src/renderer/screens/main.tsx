import { useEffect, useState } from 'react';
import Navigation from './navigation';

/**
 * Check if the user is logged in and display the correct message.
 * @param authState The authState
 * @returns The correct message
 */
function LoginCheck(
  { authState, setAuthState }: { authState: boolean, setAuthState: (state: boolean) => void },
) {
  /**
   * Do the login to OCLC via Oauth
   */
  const login = async () => {
    window.electron.login();
  };

  /**
   * Delete the stored token and log out.
   */
  const logout = async () => {
    window.electron.logout();
    setAuthState(false);
  };

  return (authState) ? (
    <>
      <p className="bordered">Already logged in</p>
      <button type="button" onClick={logout}>Logout</button>
    </>
  ) : (
    <>
      <p>Click the button below to login to OCLC and authorize this tool on your behalf.</p>
      <button type="button" onClick={login}>Login</button>
    </>
  );
}

export default function MainScreen() {
  const [authState, setAuthState] = useState<boolean>(false);
  useEffect(() => {
    window.electron.isLoggedIn().then((code) => {
      setAuthState(code);
    }).catch((err) => {
      window.electron.writeLog(err.message, 'error');
    });
    window.electron.onTokenReceived((token) => {
      setAuthState(token);
    });
  }, []);

  return (
    <main>
      <h1>OCLC WorldCat Search Tool</h1>
      <Navigation />
      <div>
        <h3>Welcome to the OCLC Search tool.</h3>
        <p>
          This tool is meant to allow you to search OCLC for specific records and get back
          information about the records and holdings from OCLC WorldCat.
        </p>
        <p>
          The above navigation will take you between this page (Home), a page to search for single
          records (Search) and a page to upload a spreadsheet of records (Batch).
        </p>
      </div>
      <div id="login">
        <h3>Login</h3>
        <p>
          You will require a U of M Libraries institutional account with Worldcat to use this tool.
          You will be asked to login to WorldCat and then
          {' '}
          <b>Allow</b>
          {' '}
          access
          to the Search API. You should only need to log in approximately once per week.
        </p>
        <LoginCheck authState={authState} setAuthState={setAuthState} />
      </div>
    </main>
  );
}
