import { useContext, useState, MouseEvent as ReactMouseEvent } from "react";
import Navigation from "./navigation";
import { AppRecordsContext, AppRecordsDispatchContext, RecordsActionSchema, RecordsSchema } from "../context/RecordsContext";
import { CellAddress, WorkSheet, utils as XLSXUtils, read as XLSX_read } from "xlsx";
import WorkingImage from '../../../assets/processing.gif';
import { DiscoveryQuery, briefRecordJsonHeaders, formatBriefRecordToJson } from "../interfaces/oclc_interfaces";
import RecordList from "./record";


export default function BatchForm() {
  const recordsDispatch = useContext(AppRecordsDispatchContext) as React.Dispatch<RecordsActionSchema>;
  const recordsContext = useContext(AppRecordsContext) as RecordsSchema;

  const [ status, setStatus ] = useState({type: '', message: ''});
  const [ working, setWorking ] = useState(false);
  const [ displayHelp, setDisplayHelp ] = useState(false);
  
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
   * Read an Excel file into a XLSX WorkSheet object.
   * @param spreadsheet An Excel file to import.
   * @returns XLSX WorkSheet object.
   */
  const importFile = async (spreadsheet: File): Promise<WorkSheet> => {
    const fileReader = await new FileReader()
    fileReader.readAsArrayBuffer(spreadsheet)
    return new Promise((resolve, reject) => {
      fileReader.onload = (e: any) => {
        const bufferArray = e?.target.result
        const wb = XLSX_read(bufferArray, { type: "buffer" })
        const sheet = wb.Sheets[wb.SheetNames[0]]

        const data = XLSXUtils.json_to_sheet(XLSXUtils.sheet_to_json(sheet, { blankrows: false}));
        resolve(data);
      }
      fileReader.onerror = (error) => {
        console.error({"error": error});
        reject(error);
      };
    });
  };

  /**
   * Handles the upload of a csv or Excel file.
   * @param fileInput (HTMLElement|null) The file input element
   * @returns 
   */
  const uploadFile = (fileInput: HTMLElement|null, evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    window.electron.isLoggedIn(); // Make sure we are logged in
    if (!fileInput) {
      setStatus({type: 'error', message: 'File input not found'});
      return;
    } else if (!(fileInput instanceof HTMLInputElement)) {
      setStatus({type: 'error', message: 'File input is not an input element'});
      return; 
    } else {
      const uploadFile = fileInput.files;
      if (uploadFile && uploadFile?.length > 0) {
        const theFile = uploadFile[0];
        console.log("File uploaded is " + theFile.path)
        setWorking(true);
        importFile(theFile).then((data: WorkSheet) => {
          searchSpreadsheet(data).then(() => {
            setWorking(false);
          });
        }).catch((err) => {
          console.error(err.message);
          setWorking(false);
          setStatus({type: 'error', message: err.message});
        });
      } else {
        setStatus({type: 'error', message: 'No file selected'});
      }
    }
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
      let MMS_id: CellAddress = null as unknown as CellAddress;
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSXUtils.encode_cell({ c: C, r: firstRow });
        if (sheet[cell]) {
          const searchValue = sheet[cell].v;
          console.log('Column ' + C + ' is ' + searchValue);
          if (searchValue.toLowerCase().includes('oclc control number')) {
            checkNumberRanges.set('oclc', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('isbn')) {
            checkNumberRanges.set('isbn', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('issn')) {
            checkNumberRanges.set('issn', { c: C, r: firstRow });
          } else if (searchValue.toLowerCase().includes('mms id')) {
            MMS_id = { c: C, r: firstRow } as CellAddress;
          }
        }
      }
      if (checkNumberRanges.size === 0) {
        setWorking(false);
        setStatus({type: 'error', message:'No OCLC Number, ISBN or ISSN column found'});
        return;
      }
      const checkNumberKeys = Array.from(checkNumberRanges.keys());
      let checkColumn: CellAddress;
      let checkType: string;
      const workingText = document.getElementById('workingText');
      for (let R = firstRow + 1; R <= range.e.r; R++) {
        let mmsCellValue: string = '';
        if (MMS_id !== undefined) {
          const mmsCell = XLSXUtils.encode_cell({ c: MMS_id.c, r: R });
          if (sheet[mmsCell]) {
            console.log("MMS ID: " + sheet[mmsCell].v);
            mmsCellValue = sheet[mmsCell].v as string;
          }
        }
        for (const c of checkNumberKeys) {
          checkType = c;
          checkColumn = checkNumberRanges.get(c) as CellAddress;
          const cell = XLSXUtils.encode_cell({ c: checkColumn.c, r: R });
          if (sheet[cell]) {
            console.log("Matching " + checkType + " : searching " + sheet[cell].v);
            const searchValue = sheet[cell].v;
            const query = new DiscoveryQuery({ searchType: checkType, searchNumber: searchValue });
            if (workingText) {
              workingText.innerHTML = 'Processing... ' + R + ' of ' + range.e.r;
            }
            await window.electron.getBibHoldings(query.toJSON(), mmsCellValue).then((data) => {
              recordsDispatch({'type': 'add', 'new_records': data});
            }).catch((err) => {
              console.error(err.message);
              setStatus({type: 'error', message: err.message});
              throw err;
            });
            continue;
          }
        }
      }
    }
  };

  /**
   * Save the spreadsheet data to a file.
   */
  const saveSpreadsheet = (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    // Make array of arrays with headers and data
    const outputData = [briefRecordJsonHeaders].concat(recordsContext.records.flatMap((record) => formatBriefRecordToJson(record)));
    window.electron.exportFile(outputData).then((filepath: string|undefined) => {
      if (filepath === undefined) {
        return;
      } else if (filepath && filepath.length > 0) {
        console.log("File saved as " + filepath);
        setStatus({type: 'success', message: 'File saved as ' + filepath});
      }
    }).catch((err: Error) => {
      console.error(err.message);
      setStatus({type: 'error', message: err.message});
    });
  };

  /**
   * Clear the records from the context.
   */
  const clear = (evt: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();
    recordsDispatch({'type': 'reset', 'new_records': []});
    setStatus({'type': '', 'message':''});
  };

  /**
   * Display the help text.
   */
  const Help = () => {
    return (displayHelp) ? (
      <>
      <p><a className="mini-link" onClick={() => setDisplayHelp(!displayHelp)}>Hide Help</a></p>
      <p>This form expects an Excel spreadsheet with column headers in the first row. These headers should have at least one cell containing one of the texts:</p>
        <ul>
          <li>OCLC Control Number</li>
          <li>ISBN</li>
          <li>ISSN</li>
        </ul>
        <p>More than one of the above column headers is acceptable. The order of precendence for searching is <b>OCLC Control Number</b> -&gt; <b>ISBN</b> -&gt; <b>ISSN</b>.</p>
        <p><i>Choose file</i> to select the spreadsheet and then click <i>Upload</i>. It will immediately start processing.</p>
        <p>Once complete you will see records displayed below and two
        new buttons <i>Save Data</i> and <i>Clear Data</i>.</p>
        </>
    ) : (
      <p><a className="mini-link" onClick={() => setDisplayHelp(!displayHelp)}>Show Help</a></p>
    );
  };

  return (
    <main>
      <h1>OCLC WorldCat Search Tool - Batch</h1>
      <Navigation />
      <div>
        <h3>Batch Process</h3>
        <Help />
        { status && <p className={status['type']}>{status['message']}</p>}
        <div id="search">
          <form id="batchForm">
            <p>
              <label htmlFor="fileInput">Upload file:</label>
              <input type="file" id="fileInput" name="fileInput" accept='.xls,.xlsx' />
            </p>
            <p><button onClick={(evt) => uploadFile(document.getElementById('fileInput'), evt)}>Upload</button>
            {recordsContext.records.length > 0 && <button onClick={(evt) => saveSpreadsheet(evt)}>Save Data</button>}
            {recordsContext.records.length > 0 && <button onClick={(evt) => clear(evt)}>Clear Data</button>}
            </p>
          </form>
          { working && WorkInProgress() }
          <RecordList />
        </div>
      </div>
    </main>
  )
}