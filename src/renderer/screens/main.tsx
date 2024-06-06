import Navigation from './navigation'
import { useState } from 'react';

export default function MainScreen() {
  const [ authState, setAuthState ] = useState<boolean>(false);
  window.electron.isLoggedIn().then((code) => {
    console.log(code);
    setAuthState(code as boolean);
  }).catch((err) => {
    console.error(err.message);
  });

  /**
   * Do the login to OCLC via Oauth
   */
  const login = async () => {
    window.electron.login().then(() => {
      window.electron.isLoggedIn().then((code) => {
        console.log(code);
        setAuthState(code as boolean);
      }).catch((err) => {
        console.error(err.message);
      });
    }).catch((err) => {
      console.error(err.message);
    });
  }

  /**
   * Check if the user is logged in and display the correct message.
   * @param props The authState
   * @returns The correct message
   */
  function LoginCheck(props: {authState: boolean}) {
    return (props.authState) ? (
      <p className='bordered'>Already logged in</p>
    ) : (
        <>
        <p>Click the button below to login to OCLC and authorize this tool on your behalf.</p>
        <button onClick={login}>Login</button>
        </>
    );
  }

  return (
    <main>
      <h1>OCLC WorldCat Search Tool</h1>
      <Navigation />
      <div>
        <h3>Welcome to the OCLC Search tool.</h3>
        <p>This tool is meant to allow you to search OCLC for specific records and get back information about the records and holdings from OCLC WorldCat.</p>
        <p>The above navigation will take you between this page (Home), a page to search for single records (Search) and a page to upload a spreadsheet
          of records (Batch).</p>
      </div>
      <div id="login">
        <h3>Login</h3>
        <p>You will require a U of M Libraries institutional account with Worldcat to use this tool. You will be asked to login to WorldCat and then <b>Allow</b> access
         to the Search API. You should only need to log in approximately once per week.</p>
        <LoginCheck authState={authState}/>
      </div>
    </main>
  )
}
