import {
  useContext, useState, MouseEvent as ReactMouseEvent, ChangeEvent as ReactChangeEvent,
} from 'react';
import {
  CellAddress, WorkSheet, utils as XLSXUtils, read as XLSX_read,
} from 'xlsx';
import Navigation from './navigation';
import {
  AppRecordsContext, AppRecordsDispatchContext,
} from '../context/RecordsContext';
import WorkingImage from '../../../assets/processing.gif';
import { DiscoveryQuery, briefRecordJsonHeaders, formatBriefRecordToJson } from '../interfaces/oclc_interfaces';
import RecordList from './record';

const filterLocalKey = 'filter_local';

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
 * Display the help text.
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
        This form expects an Excel spreadsheet with column headers in the first row. These headers
        should have at least one cell containing one of the texts:
      </p>
      <ul>
        <li>OCLC Control Number</li>
        <li>ISBN</li>
        <li>ISSN</li>
      </ul>
      <p>
        More than one of the above column headers is acceptable. The order of precendence
        for searching is
        <b>OCLC Control Number</b>
        {' '}
        -&gt;
        <b>ISBN</b>
        {' '}
        -&gt;
        <b>ISSN</b>
        .
      </p>
      <p>
        <i>Choose file</i>
        {' '}
        to select the spreadsheet and then click
        {' '}
        <i>Upload</i>
        . It will immediately start processing.
      </p>
      <p>
        Once complete you will see records displayed below and two
        new buttons
        <i>Save Data</i>
        {' '}
        and
        <i>Clear Data</i>
        .
      </p>
      <p>
        <b>Save Data</b>
        {' '}
        will prompt to save the data to a new Excel spreadsheet. Each row will contain
      </p>
      <ul>
        <li>MMS ID</li>
        <li>OCLC Number</li>
        <li>Title</li>
        <li>Creator</li>
        <li>Date</li>
        <li>Language</li>
        <li>General Format</li>
        <li>Specific Format</li>
        <li>Edition</li>
        <li>Publisher</li>
        <li>Publication Place</li>
        <li>Merged Oclc Numbers</li>
        <li>ISBNs</li>
        <li>ISSNs</li>
        <li>Institution Name</li>
        <li>OCLC Symbol</li>
        <li>Registry Id</li>
        <li>Country</li>
        <li>State</li>
        <li>ILL Status</li>
        <li>Institution Type</li>
      </ul>
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

export default function BatchForm() {
  const recordsContext = useContext(AppRecordsContext);
  const recordsDispatch = useContext(AppRecordsDispatchContext);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [working, setWorking] = useState(false);
  const [filterLocal, setFilterLocal] = useState(false);

  // Set the filter local checkbox value to the stored value from previous sessions.
  window.electron.getStore(filterLocalKey).then((value) => {
    if (value !== undefined) {
      setFilterLocal(value as boolean);
    }
  });

  // function to store the filter local checkbox value for future sessions
  // based on a change to the checkbox.
  const changeFilterLocal = (evt: ReactChangeEvent<HTMLInputElement>) => {
    const { checked } = evt.currentTarget;
    setFilterLocal(checked);
    window.electron.setStore(filterLocalKey, checked);
  };

  /**
   * Clear the records from the context.
   */
  const clear = (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    recordsDispatch({ type: 'reset', new_records: [] });
    setStatus({ type: '', message: '' });
  };

  /**
   * Save the spreadsheet data to a file.
   */
  const saveSpreadsheet = (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    // Make array of arrays with headers and data
    const outputData = [briefRecordJsonHeaders].concat(
      recordsContext.records.flatMap(
        (record) => formatBriefRecordToJson(record, filterLocal),
      ),
    );
    window.electron.exportFile(outputData).then((filepath: string | undefined) => {
      if (filepath && filepath.length > 0) {
        window.electron.writeLog(`File saved as ${filepath}`, 'info');
        setStatus({ type: 'success', message: `File saved as ${filepath}` });
      }
    }).catch((err: Error) => {
      window.electron.writeLog(err.message, 'error');
      setStatus({ type: 'error', message: err.message });
    });
  };

  /**
   * Read an Excel file into a XLSX WorkSheet object.
   * @param spreadsheet An Excel file to import.
   * @returns XLSX WorkSheet object.
   */
  const importFile = async (spreadsheet: File): Promise<WorkSheet> => {
    const fileReader = await new FileReader();
    fileReader.readAsArrayBuffer(spreadsheet);
    return new Promise((resolve, reject) => {
      fileReader.onload = (e: any) => {
        const bufferArray = e?.target.result;
        const wb = XLSX_read(bufferArray, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        const data = XLSXUtils.json_to_sheet(XLSXUtils.sheet_to_json(sheet, { blankrows: false }));
        resolve(data);
      };
      fileReader.onerror = (error) => {
        window.electron.writeLog({ error }, 'error');
        reject(error);
      };
    });
  };

  /**
   * Performs searches for OCLC, ISBN or ISSN numbers in a spreadsheet.
   * @param sheet The spreadsheet data to search
   */
  const searchSpreadsheet = async (sheet: WorkSheet) => {
    if (sheet['!ref'] === undefined) {
      throw new Error('No data in spreadsheet');
    }
    const range = XLSXUtils.decode_range(sheet['!ref']);
    if (range.s.r !== undefined && range.e.r !== undefined) {
      // First row is the header row
      const firstRow = range.s.r;
      const checkNumberRanges: Map<string, CellAddress> = new Map();
      let MmsId: CellAddress = null as unknown as CellAddress;
      for (let C = range.s.c; C <= range.e.c; C += 1) {
        const cell = XLSXUtils.encode_cell({ c: C, r: firstRow });
        if (sheet[cell]) {
          const searchValue = sheet[cell].v;
          window.electron.writeLog(`Column ${C} is ${searchValue}`, 'debug');
          if (searchValue.toLowerCase().includes('oclc control number')) {
            checkNumberRanges.set('oclc', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('isbn')) {
            checkNumberRanges.set('isbn', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('issn')) {
            checkNumberRanges.set('issn', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('mms id')) {
            MmsId = { c: C, r: firstRow } as CellAddress;
          }
        }
      }
      if (checkNumberRanges.size === 0) {
        setWorking(false);
        setStatus({ type: 'error', message: 'No OCLC Number, ISBN or ISSN column found' });
        return;
      }
      const checkNumberKeys = Array.from(checkNumberRanges.keys());
      let checkColumn: CellAddress;
      let checkType: string;
      const workingText = document.getElementById('workingText');
      try {
        for (let R = firstRow + 1; R <= range.e.r; R += 1) {
          let mmsCellValue: string = '';
          if (MmsId !== undefined) {
            const mmsCell = XLSXUtils.encode_cell({ c: MmsId.c, r: R });
            if (sheet[mmsCell]) {
              window.electron.writeLog(`MMS ID: ${sheet[mmsCell].v}`, 'debug');
              mmsCellValue = sheet[mmsCell].v as string;
            }
          }
          for (let checkIter = 0; checkIter < checkNumberKeys.length; checkIter += 1) {
            checkType = checkNumberKeys[checkIter];
            checkColumn = checkNumberRanges.get(checkType) as CellAddress;
            const cell = XLSXUtils.encode_cell({ c: checkColumn.c, r: R });
            if (sheet[cell]) {
              window.electron.writeLog(`Matching ${checkType} : searching ${sheet[cell].v}`, 'debug');
              const searchValue = sheet[cell].v;
              const query = new DiscoveryQuery({
                searchType: checkType,
                searchNumber: searchValue,
              });
              if (workingText) {
                workingText.innerHTML = `Processing... ${R} of ${range.e.r}`;
              }
              window.electron.getBibHoldings(query.toJSON(), mmsCellValue).then((data) => {
                recordsDispatch({ type: 'add', new_records: data });
              });
              break;
            }
          }
        }
      } catch (err: any) {
        window.electron.writeLog(err.message, 'error');
        setStatus({ type: 'error', message: err.message });
        throw err;
      }
    }
  };

  /**
   * Handles the upload of a csv or Excel file.
   * @param fileInput (HTMLElement|null) The file input element
   * @returns
   */
  const uploadFile = (
    fileInput: HTMLElement | null,
    evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    evt.preventDefault();
    window.electron.isLoggedIn(); // Make sure we are logged in
    if (!fileInput) {
      setStatus({ type: 'error', message: 'File input not found' });
    } else if (!(fileInput instanceof HTMLInputElement)) {
      setStatus({ type: 'error', message: 'File input is not an input element' });
    } else {
      const uploadedFile = fileInput.files;
      if (uploadedFile && uploadedFile?.length > 0) {
        const theFile = uploadedFile[0];
        window.electron.writeLog(`File uploaded is ${theFile.path}`, 'info');
        setWorking(true);
        importFile(theFile).then((data: WorkSheet) => {
          searchSpreadsheet(data).then(() => {
            setWorking(false);
          });
        }).catch((err) => {
          window.electron.writeLog(err.message, 'error');
          setWorking(false);
          setStatus({ type: 'error', message: err.message });
        });
      } else {
        setStatus({ type: 'error', message: 'No file selected' });
      }
    }
  };

  return (
    <main>
      <h1>OCLC WorldCat Search Tool - Batch</h1>
      <Navigation />
      <div>
        <h3>Batch Process</h3>
        <Help />
        { status && <p className={status.type}>{status.message}</p>}
        <div id="search">
          <form id="batchForm">
            <p>
              <label htmlFor="fileInput">
                Upload file:
                <input type="file" id="fileInput" name="fileInput" accept=".xls,.xlsx" />
              </label>
            </p>
            <p>
              <button
                type="button"
                onClick={(evt) => uploadFile(document.getElementById('fileInput'), evt)}
              >
                Upload
              </button>
              {
                recordsContext.records.length > 0
                && <button type="button" onClick={(evt) => saveSpreadsheet(evt)}>Save Data</button>
              }
              {
                recordsContext.records.length > 0
                && <button type="button" onClick={(evt) => clear(evt)}>Clear Data</button>
              }
            </p>
            {recordsContext.records.length > 0 && (
            <p>
              <input onChange={(evt) => changeFilterLocal(evt)} type="checkbox" checked={filterLocal} name="filterLocal" />
              {' '}
              Filter local holdings from output.
            </p>
            )}
          </form>
          { working && WorkInProgress() }
          <RecordList />
        </div>
      </div>
    </main>
  );
}
