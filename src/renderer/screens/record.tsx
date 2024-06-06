import React, { useContext } from 'react';
import { BriefRecordInterface }  from '../interfaces/oclc_interfaces';
import { AppRecordsContext, AppRecordsDispatchContext, RecordsActionSchema, RecordsSchema } from '../context/RecordsContext';

/**
 * Display a list of records as a table.
 * @returns table of records
 */
export default function RecordList() {
  const recordsContext = useContext(AppRecordsContext) as RecordsSchema;
  const recordsDispatchContext = useContext(AppRecordsDispatchContext) as React.Dispatch<RecordsActionSchema>;
  
  /**
   * @param record Format a single record as a table row.
   * @returns a table row
   */
  function Record(record: BriefRecordInterface) {
    function handleRemoveTask(record: BriefRecordInterface) {
      recordsDispatchContext({
        type: 'remove_records',
        new_records: [record],
      });
    }
    return (
      <tr className="data-row" key={record.oclcNumber}>
        <td className="table-cell">{record.title}</td>
        <td className="table-cell">{record.oclcNumber}</td>
        <td className="table-cell">{record.mergedOclcNumbers == undefined ? " " : record.mergedOclcNumbers.join(', ')}</td>
        <td className="table-cell">{record.isbns == undefined ? " " : record.isbns.join(', ')}</td>
        <td className="table-cell">{record.issns == undefined ? " " : record.issns.join(', ')}</td>
        <td className="table-cell">{record.creator}</td>
        <td className="table-cell">{record.date}</td>
        <td className="table-cell">{record.language}</td>
        <td className="table-cell">{record.generalFormat}</td>
        <td className="table-cell">{record.specificFormat}</td>
        <td className="table-cell">{record.edition}</td>
        <td className="table-cell">{record.publisher}</td>
        <td className="table-cell">{record.publicationPlace}</td>
        <td className="table-cell"><button onClick={() => handleRemoveTask(record)}>Remove</button></td>
      </tr>
    )
  }

  return (recordsContext.records.length == 0) ?  (<></>) : (
    <div id="search_results" className="data_table batch_search">
      <h2>Records</h2>
      <p>{recordsContext.records.length} records found.</p>
      <table>
        <thead>
          <tr className="header-row">
            <th className="table-cell">Title</th>
            <th className="table-cell">OCLC Number</th>
            <th className="table-cell">Merged OCLC Numbers</th>
            <th className="table-cell">ISBN</th>
            <th className="table-cell">ISSN</th>
            <th className="table-cell">Creator</th>
            <th className="table-cell">Date</th>
            <th className="table-cell">Language</th>
            <th className="table-cell">General Format</th>
            <th className="table-cell">Specific Format</th>
            <th className="table-cell">Edition</th>
            <th className="table-cell">Publisher</th>
            <th className="table-cell">Publication Place</th>
            <th className="table-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recordsContext.records.map((record: BriefRecordInterface) => (
              Record(record)
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Formats a single search record into a div of information.
 * @param props properties, processed boolean is whether we have performed a search
 * @returns The formatted search records
 */
export function SingleSearchRecords(props: { processed: boolean }) {
  const recordsContext = useContext(AppRecordsContext) as RecordsSchema;

  if (recordsContext.records.length > 0) {
    return (
      <SingleSearchRecordList />
    )
  } else {
    <></>
  };

  /**
   * Formats a single record into a table of holdings information.
   * @param record a single record
   * @returns A table of the holdings information
   */
  function SingleSearchHoldings(record: BriefRecordInterface) {
    if (record.institutionHolding === undefined || record.institutionHolding.briefHoldings === undefined || record.institutionHolding.briefHoldings.length === 0) {
      return <p>No holdings found</p>;
    } else {
      return (
        <div>
          <h3>Holdings</h3>
          <table>
            <thead>
              <tr key="-999">
                <th>Institution</th>
                <th>OCLC Symbol</th>
                <th>OCLC<br/>Registry ID</th>
                <th>Country<br/><span className="nowrap">(ISO-3166-1)</span><br/> <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_new">reference</a></th>
                <th>State/Province<br/><span className="nowrap">(ISO-3166-2)</span><br/><a href="https://en.wikipedia.org/wiki/ISO_3166-2" target="_new">reference</a></th>
                <th>ILL Status</th>
                <th>Institution Type</th>
              </tr>
            </thead>
            <tbody>
              {record.institutionHolding.briefHoldings.map((holding) => (
                <tr key={holding.registryId + ''}>
                  <td>{holding.institutionName}</td>
                  <td>{holding.oclcSymbol}</td>
                  <td>{holding.registryId + ''}</td>
                  <td>{holding.country}</td>
                  <td>{holding.state}</td>
                  <td>{holding.illStatus}</td>
                  <td>{holding.institutionType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }

  /**
   * Formats a list of records into a div of information.
   * @returns The formatted search records
   */
  function SingleSearchRecordList() {
    if (recordsContext.records.length === 0) {
      return (<></>);
    } else {
      return (
        <div id="search_results" className="data_table single_search">
          <h2>Records</h2>
          <p>{recordsContext.records.length} records found.</p>
          {recordsContext.records.map((record: BriefRecordInterface) => (
            <div key={record.oclcNumber} className='result-record'>
              <h3>{record.title}</h3>
              <p><b>OCLC Number:</b> {record.oclcNumber}</p>
              <p><b>Merged OCLC Numbers:</b> {record.mergedOclcNumbers == undefined ? " " : record.mergedOclcNumbers.join(', ')}</p>
              <p><b>ISBN:</b> {record.isbns == undefined ? " " : record.isbns.join(', ')}</p>
              <p><b>ISSN:</b> {record.issns == undefined ? " " : record.issns.join(', ')}</p>
              <p><b>Creator:</b> {record.creator}</p>
              <p><b>Date:</b> {record.date}</p>
              <p><b>Language:</b> {record.language}</p>
              <p><b>General Format:</b> {record.generalFormat}</p>
              <p><b>Specific Format:</b> {record.specificFormat}</p>
              <p><b>Edition:</b> {record.edition}</p>
              <p><b>Publisher:</b> {record.publisher}</p>
              <p><b>Publication Place:</b> {record.publicationPlace}</p>
              <SingleSearchHoldings {...record} />
            </div>
          ))}
        </div>
      )
    }
  }
}
