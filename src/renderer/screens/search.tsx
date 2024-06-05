import { useState, MouseEvent as ReactMouseEvent, useContext } from 'react';
import Navigation from './navigation';
import { SingleSearchRecords } from './record';
// import FormatAutoComplete from '../services/filter_format.service';
import WorkingImage from '../../../assets/processing.gif';
import { AppSettingsContext, AppSettingsDispatchContext, SettingsActionSchema, SettingsSchema } from '../context/SettingsContext';
import { DiscoveryQuery } from '../interfaces/oclc_interfaces';
import { AppRecordsContext, AppRecordsDispatchContext, RecordsActionSchema, RecordsSchema } from '../context/RecordsContext';

export default function SearchForm() {
  const searchSettings = useContext(AppSettingsContext) as SettingsSchema;
  const settingsDispatch = useContext(AppSettingsDispatchContext) as React.Dispatch<SettingsActionSchema>;
  const recordsDispatch = useContext(AppRecordsDispatchContext) as React.Dispatch<RecordsActionSchema>;
  const recordsContext = useContext(AppRecordsContext) as RecordsSchema;

  const [ status, setStatus ] = useState({type: '', message: ''});
  const [ working, setWorking ] = useState(false);
  const [ searchNum, set_searchNumber ] = useState('');
  const [ displayHelp, setDisplayHelp ] = useState(false);
  const [ processed, setProcessed ] = useState(false);

  /**
   * @returns The working in progress image
   */
  const WorkInProgress = () => {
    return (
      <div id="working">
        <div className="working_overlay">
          <img className="working" src={WorkingImage} alt="Processing..."></img>
          <div id="workingText" className="working_text">Processing...</div>
        </div>
      </div>
    )
  };

  /**
   * @returns The search number input fields with the correct selected
   */
  const SearchNumbers = () => {
    return (
      <p>
        <label htmlFor='type'>Search using:</label><input type="hidden" name="type" value={searchSettings['search']['searchNumber']} />
        <span className={(searchSettings['search']['searchNumber'] == 'oclc' ? 'selected ' : '') + 'selectTypes' } data-searchnumber="oclc" onClick={() => settingsDispatch({'type': 'set_searchNumber', 'value': 'oclc'})}>OCLC Number</span>
        <span className={(searchSettings['search']['searchNumber'] == 'isbn' ? 'selected ' : '') + 'selectTypes' } data-searchnumber="isbn" onClick={() => settingsDispatch({'type': 'set_searchNumber', 'value': 'isbn'})}>ISBN</span>
        <span className={(searchSettings['search']['searchNumber'] == 'issn' ? 'selected ' : '') + 'selectTypes' } data-searchnumber="issn" onClick={() => settingsDispatch({'type': 'set_searchNumber', 'value': 'issn'})}>ISSN</span>
      </p>  
    )
  };

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
      const searchNumberType = formData.get('type')?.toString() || 'oclc';
      const searchFormat = formData.get('format')?.toString() || '';
      if (searchNumber) {
        setStatus({type: '', message: ''})
        set_searchNumber(searchNumber);
        console.log("Searching for " + searchNumberType + " : " + searchNumber);
        setWorking(true);
        const query = new DiscoveryQuery({ searchNumber: searchNumber, searchType: searchNumberType });
        if (searchFormat) {
          query.addHoldingsFilterFormat(searchFormat);
        }
        recordsDispatch({'type': 'reset', 'new_records': []});
        window.electron.getBibHoldings(query.toJSON()).then((data) => {
          recordsDispatch({'type': 'set', 'new_records': data});
          setWorking(false);
          setProcessed(true);
        }).catch((err) => {
          console.error(err.message);
          setWorking(false);
          setStatus({type: 'error', message: err.message});
        });
      } else {
        setStatus({type: 'error', message: 'No search number provided'});
      }
    } else {
      setStatus({type: 'error', message: 'Form not found'});
    }
  };

  /**
   * @returns The appropriate search form based on the selected search type
   */
  const SearchForm = () => {
    return (
      <form id="singleForm">
        <SearchNumbers />
        <p>
          <label htmlFor='search'>Number:</label>
          <input type='text' id='searchBtn' name='search' defaultValue={searchNum}/>
        </p>
        { /*<p>Limit to item type: <FormatAutoComplete /></p>*/}
        <p><button onClick={(evt) => doSingleSearch(evt)}>Search</button>
        { recordsContext.records.length > 0 && <button onClick={() => {recordsDispatch({'type': 'reset', 'new_records': []}); setProcessed(false);}}>Clear Data</button>}
        </p>
      </form>
    )
  };

  /**
   * @returns The help text for the search form
   */
  const Help = () => {
    return (displayHelp) ? (
      <>
        <p><a className='mini-link' onClick={() => setDisplayHelp(!displayHelp)}>Hide Help</a></p>
        <p>This page allows you to perform an adhoc search of the WorldCat Bibliographic Holdings API.</p>
        <p>Click to choose the type of identifier you are searching, then enter the number in the <i>Number</i> box and click <i>Search</i></p>
      </>
    ) : (
      <p><a className='mini-link' onClick={() => setDisplayHelp(!displayHelp)}>Show Help</a></p>
    )
  };

  return (
    <main>
      <h1>OCLC WorldCat Search Tool - Single</h1>
      <Navigation />
      <div>
        <h3>Search</h3>
        <Help />
        { status && <p className={status['type']}>{status['message']}</p>}
        <div id="search">
          <SearchForm />  
            { working && WorkInProgress() }
            <SingleSearchRecords processed={processed} />
        </div>
      </div>
    </main>
  )
}
