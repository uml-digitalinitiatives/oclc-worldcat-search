import axios from 'axios';
import { dialog } from 'electron';
import * as XLSX from 'xlsx';
import { BriefRecordInterface, DiscoveryQuery } from '../renderer/interfaces/oclc_interfaces';
import { getAccessToken } from './main';
const fs = require('fs');

const OCLC_SEARCH_URL = 'https://americas.discovery.api.oclc.org/worldcat/search/v2';
const OCLC_BIB_HOLDINGS_URL = OCLC_SEARCH_URL + '/bibs-holdings';

/**
 * Do a search for bibliographic holdings using the OCLC Discovery API.
 * @param query A JSON string representing a DiscoveryQuery object.
 * @returns An array of BriefRecordInterface objects.
 */
export const getBibHoldings = async (query: string, mmsId: string = ''): Promise<Array<BriefRecordInterface>> => {
  return await doSearch(query).then((data) => {
    const records: Array<BriefRecordInterface> = [];
    if (data['numberOfRecords'] > 0) {
      data['briefRecords'].forEach((record: BriefRecordInterface) => records.push({...record, mmsId: mmsId}));
    }
    return records;
  }).catch((error) => {
    if (error.response && error.response.data) {
      if (error.response.data['detail']) {
        throw new Error(error.message + ': ' + error.response.data['detail']);
      } else {
        throw new Error(error.message + ': ' + error.response.data['message']);
      }
    }
  }) as Array<BriefRecordInterface>;
};

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
  console.log("Access token: " + token.access_token);

  const dq: DiscoveryQuery = DiscoveryQuery.fromJSON(query);

  return axios.get(OCLC_BIB_HOLDINGS_URL, {
    headers: {
      'Authorization': 'Bearer ' + token.access_token,
      'Accept': 'application/json',
    },
    params: dq.toSearchString(),
  }).then((response) => {
    if (response.status !== 200) {
      console.error(response.data);
      // Could need a refresh
    } else {
      return response.data;
    }
  });
};

/**
 * Write a XLSX WorkSheet object to a file.
 * @param file The worksheet to write to a file as array of array of strings.
 * @returns The name of the file written, undefined if cancelled.
 */
export const exportFile = async (file: string[][]): Promise<string|undefined> => {
  return new Promise((resolve, reject) => {
    const newSheet = XLSX.utils.aoa_to_sheet(file);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, newSheet, 'Sheet1');
    const filePath = dialog.showSaveDialog({
      title: 'Save file as',
      filters: [{
        name: "Excel Spreadsheets",
        extensions: ["xlsx", "xls"]
      }]
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
  });
};

