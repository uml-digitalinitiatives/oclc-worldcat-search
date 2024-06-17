import { useContext } from 'react';
import { BriefRecordInterface } from '../interfaces/oclc_interfaces';
import { AppRecordsContext } from '../context/RecordsContext';

/**
   * @param record Format a single record as a table row.
   * @returns a table row
   */
function Record(record: BriefRecordInterface) {
  const {
    oclcNumber,
    title,
    mergedOclcNumbers,
    isbns,
    issns,
    creator,
    date,
    language,
    generalFormat,
    specificFormat,
    edition,
    publisher,
    publicationPlace,
  } = record;
  return (
    <tr className="data-row" key={oclcNumber}>
      <td className="table-cell">{title}</td>
      <td className="table-cell">{oclcNumber}</td>
      <td className="table-cell">{mergedOclcNumbers === undefined ? ' ' : mergedOclcNumbers.join(', ')}</td>
      <td className="table-cell">{isbns === undefined ? ' ' : isbns.join(', ')}</td>
      <td className="table-cell">{issns === undefined ? ' ' : issns.join(', ')}</td>
      <td className="table-cell">{creator}</td>
      <td className="table-cell">{date}</td>
      <td className="table-cell">{language}</td>
      <td className="table-cell">{generalFormat}</td>
      <td className="table-cell">{specificFormat}</td>
      <td className="table-cell">{edition}</td>
      <td className="table-cell">{publisher}</td>
      <td className="table-cell">{publicationPlace}</td>
    </tr>
  );
}

/**
 * Display a list of records as a table.
 * @returns table of records
 */
export default function RecordList() {
  const recordsContext = useContext(AppRecordsContext);
  if (recordsContext.records && recordsContext.records.length > 0) {
    return (
      <div id="search_results" className="data_table batch_search">
        <h2>Records</h2>
        <p>
          {recordsContext.records.length}
          {' '}
          records found.
        </p>
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
}

/**
   * Formats a single record into a table of holdings information.
   * @param record a single record
   * @returns A table of the holdings information
   */
function SingleSearchHoldings({ record }: { record: BriefRecordInterface }) {
  const { institutionHolding } = record;
  const { briefHoldings } = institutionHolding;
  if (
    briefHoldings === undefined
    || briefHoldings.length === 0
  ) {
    return <p>No holdings found</p>;
  }
  return (
    <div>
      <h3>Holdings</h3>
      <table>
        <thead>
          <tr key="-999">
            <th>Institution</th>
            <th>OCLC Symbol</th>
            <th>
              OCLC
              <br />
              Registry ID
            </th>
            <th>
              Country
              <br />
              <span className="nowrap">(ISO-3166-1)</span>
              <br />
              {' '}
              <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_new">reference</a>
            </th>
            <th>
              State/Province
              <br />
              <span className="nowrap">(ISO-3166-2)</span>
              <br />
              <a href="https://en.wikipedia.org/wiki/ISO_3166-2" target="_new">reference</a>
            </th>
            <th>ILL Status</th>
            <th>Institution Type</th>
          </tr>
        </thead>
        <tbody>
          {briefHoldings.map((holding) => {
            const {
              registryId, institutionName, oclcSymbol, country, state, illStatus, institutionType,
            } = holding;
            return (
              <tr key={`${registryId}`}>
                <td>{institutionName}</td>
                <td>{oclcSymbol}</td>
                <td>{`${registryId}`}</td>
                <td>{country}</td>
                <td>{state}</td>
                <td>{illStatus}</td>
                <td>{institutionType}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Formats a list of records into a div of information.
 * @returns The formatted search records
 */
function SingleSearchRecordList() {
  const recordsContext = useContext(AppRecordsContext);
  if (recordsContext.records && recordsContext.records.length > 0) {
    return (
      <div id="search_results" className="data_table single_search">
        <h2>Records</h2>
        <p>
          {recordsContext.records.length}
          {' '}
          records found.
        </p>
        {recordsContext.records.map((record: BriefRecordInterface) => (
          <div key={record.oclcNumber} className="result-record">
            <h3>{record.title}</h3>
            <p>
              <b>OCLC Number:</b>
              {' '}
              {record.oclcNumber}
            </p>
            <p>
              <b>Merged OCLC Numbers:</b>
              {' '}
              {record.mergedOclcNumbers === undefined ? ' ' : record.mergedOclcNumbers.join(', ')}
            </p>
            <p>
              <b>ISBN:</b>
              {' '}
              {record.isbns === undefined ? ' ' : record.isbns.join(', ')}
            </p>
            <p>
              <b>ISSN:</b>
              {' '}
              {record.issns === undefined ? ' ' : record.issns.join(', ')}
            </p>
            <p>
              <b>Creator:</b>
              {' '}
              {record.creator}
            </p>
            <p>
              <b>Date:</b>
              {' '}
              {record.date}
            </p>
            <p>
              <b>Language:</b>
              {' '}
              {record.language}
            </p>
            <p>
              <b>General Format:</b>
              {' '}
              {record.generalFormat}
            </p>
            <p>
              <b>Specific Format:</b>
              {' '}
              {record.specificFormat}
            </p>
            <p>
              <b>Edition:</b>
              {' '}
              {record.edition}
            </p>
            <p>
              <b>Publisher:</b>
              {' '}
              {record.publisher}
            </p>
            <p>
              <b>Publication Place:</b>
              {' '}
              {record.publicationPlace}
            </p>
            <SingleSearchHoldings record={record} />
          </div>
        ))}
      </div>
    );
  }
}

/**
 * Formats a single search record into a div of information.
 * @returns The formatted search records
 */
export function SingleSearchRecords() {
  const recordsContext = useContext(AppRecordsContext);
  if (recordsContext.records && recordsContext.records.length > 0) {
    return (
      <SingleSearchRecordList />
    );
  }
}
