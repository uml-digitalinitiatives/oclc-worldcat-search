import { useState, MouseEvent as ReactMouseEvent, useContext } from 'react';
import Navigation from './navigation';
import { SingleSearchRecords } from './record';
// import FormatAutoComplete from '../services/filter_format.service';
import WorkingImage from '../../../assets/processing.gif';
import { AppSettingsContext, AppSettingsDispatchContext } from '../context/SettingsContext';
import { DiscoveryQuery } from '../interfaces/oclc_interfaces';
import { AppRecordsContext, AppRecordsDispatchContext } from '../context/RecordsContext';

/**
 * @returns The working in progress image
 */
function WorkInProgress() {
  return (
    <div id="working">
      <div className="working_overlay">
        <img className="working" src={WorkingImage} alt="Processing..." />
        <div id="workingText" className="working_text">Processing...</div>
      </div>
    </div>
  );
}

/**
 * @returns The search number input fields with the correct selected
 */
function SearchNumbers() {
  const searchSettings = useContext(AppSettingsContext);
  const settingsDispatch = useContext(AppSettingsDispatchContext);

  /**
   * Handle the click event on the search type
   * @param evt Click event on the search type
   */
  const SearchNumberOnClick = (evt: ReactMouseEvent<HTMLSpanElement, MouseEvent>) => {
    evt.preventDefault();
    const searchNumber = evt.currentTarget.getAttribute('data-searchnumber') || '';
    settingsDispatch({ type: 'set_searchNumber', value: searchNumber });
  };

  /**
   * Handle the key down event on the search type
   * @param evt Key down event on the search type
   */
  const SearchNumberOnKeyDown = (evt: React.KeyboardEvent<HTMLSpanElement>) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      const searchNumber = evt.currentTarget.getAttribute('data-searchnumber') || '';
      settingsDispatch({ type: 'set_searchNumber', value: searchNumber });
    }
  };

  if (searchSettings !== null) {
    return (
      <>
        <p>
          <label htmlFor="searchTypeInput">
            Search using:
            <input type="hidden" id="searchTypeInput" name="search_type" value={searchSettings.search.searchNumber} />
          </label>
        </p>
        <button type="button" className={searchSettings.search.searchNumber === 'oclc' ? 'selected searchTypes' : 'searchTypes'} data-searchnumber="oclc" onKeyDown={SearchNumberOnKeyDown} onClick={SearchNumberOnClick}>OCLC Number</button>
        <button type="button" className={searchSettings.search.searchNumber === 'isbn' ? 'selected searchTypes' : 'searchTypes'} data-searchnumber="isbn" onKeyDown={SearchNumberOnKeyDown} onClick={SearchNumberOnClick}>ISBN</button>
        <button type="button" className={searchSettings.search.searchNumber === 'issn' ? 'selected searchTypes' : 'searchTypes'} data-searchnumber="issn" onKeyDown={SearchNumberOnKeyDown} onClick={SearchNumberOnClick}>ISSN</button>
      </>
    );
  }
}

/**
 * @returns The appropriate search form based on the selected search type
 */
function GenerateSearchForm({
  searchNum,
  doSingleSearch,
}: {
  searchNum: string,
  doSingleSearch: (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void,
}) {
  const recordsDispatch = useContext(AppRecordsDispatchContext);
  const recordsContext = useContext(AppRecordsContext);
  return (
    <form id="singleForm">
      <SearchNumbers />
      <p>
        <label htmlFor="searchBtn">
          Number:
          <input type="text" id="searchBtn" name="search" defaultValue={searchNum} />
        </label>
      </p>
      { /* <p>Limit to item type: <FormatAutoComplete /></p> */}
      <p>
        <button type="button" onClick={(evt) => doSingleSearch(evt)}>Search</button>
        { recordsContext.records && recordsContext.records.length > 0 && <button type="button" onClick={() => { recordsDispatch({ type: 'reset', new_records: [] }); }}>Clear Data</button>}
      </p>
    </form>
  );
}

/**
 * @returns The help text for the search form
 */
function Help() {
  const [displayHelp, setDisplayHelp] = useState(false);
  return (displayHelp) ? (
    <>
      <p>
        <button
          type="button"
          className="mini-link"
          onClick={() => setDisplayHelp(!displayHelp)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setDisplayHelp(!displayHelp); } }}
        >
          Hide Help
        </button>
      </p>
      <p>
        This page allows you to perform an adhoc search of the WorldCat Bibliographic Holdings API.
      </p>
      <p>
        Click to choose the type of identifier you are searching, then enter the number in the
        <i>Number</i>
        {' '}
        box and click
        <i>Search</i>
      </p>
    </>
  ) : (
    <p>
      <button
        type="button"
        className="mini-link"
        onClick={() => setDisplayHelp(!displayHelp)}
        onKeyDown={(e) => { if (e.key === 'Enter') { setDisplayHelp(!displayHelp); } }}
      >
        Show Help
      </button>
    </p>
  );
}

export default function SearchForm() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [working, setWorking] = useState(false);
  const [searchNum, setSearchNumber] = useState('');

  const searchSettings = useContext(AppSettingsContext);
  const recordsDispatch = useContext(AppRecordsDispatchContext);

  /**
   * Do a search for a single OCLC, ISBN or ISSN number
   * @param evt Click event on the search button
   */
  const doSingleSearch = (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    window.electron.isLoggedIn(); // Make sure we are logged in
    const form = document.getElementById('singleForm');
    if (form && form instanceof HTMLFormElement) {
      const formData = new FormData(form);
      const searchNumber = formData.get('search')?.toString() || null;
      const searchFormat = formData.get('format')?.toString() || '';
      const searchNumberType = searchSettings?.search.searchNumber || '';
      if (searchNumber) {
        setStatus({ type: '', message: '' });
        setSearchNumber(searchNumber);
        console.log(`Searching for ${searchNumberType} : ${searchNumber}`);
        setWorking(true);
        const query = new DiscoveryQuery({ searchNumber, searchType: searchNumberType });
        if (searchFormat) {
          query.addHoldingsFilterFormat(searchFormat);
        }
        recordsDispatch({ type: 'reset', new_records: [] });
        window.electron.getBibHoldings(query.toJSON()).then((data) => {
          recordsDispatch({ type: 'set', new_records: data });
          setWorking(false);
        }).catch((err) => {
          console.error(err.message);
          setWorking(false);
          setStatus({ type: 'error', message: err.message });
        });
      } else {
        setStatus({ type: 'error', message: 'No search number provided' });
      }
    } else {
      setStatus({ type: 'error', message: 'Form not found' });
    }
  };

  return (
    <main>
      <h1>OCLC WorldCat Search Tool - Single</h1>
      <Navigation />
      <div>
        <h3>Search</h3>
        <Help />
        { status && <p className={status.type}>{status.message}</p>}
        <div id="search">
          <GenerateSearchForm
            searchNum={searchNum}
            doSingleSearch={doSingleSearch}
          />
          { working && WorkInProgress() }
          <SingleSearchRecords />
        </div>
      </div>
    </main>
  );
}
