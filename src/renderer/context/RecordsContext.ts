import React, { createContext } from 'react';
import { BriefRecordInterface } from '../interfaces/oclc_interfaces';

export type RecordsSchema = {
  'records': Array<BriefRecordInterface>,
};

export type RecordsActionSchema = {
  'new_records': Array<BriefRecordInterface>,
  'type': string,
};

export const initialRecordsContextState = {
  records: [],
};

export function appRecordsReducer(state: RecordsSchema, action: RecordsActionSchema) {
  window.electron.writeLog({ state, new_records: action.new_records, type: action.type }, 'debug');
  if (action === undefined) {
    return state;
  }
  switch (action.type) {
    case 'add': {
      if (action.new_records === undefined || action.new_records.length === 0) {
        return state;
      }
      const oldIds = state.records.map((record: BriefRecordInterface) => record.oclcNumber);
      const newRecords = action.new_records.filter(
        (record: BriefRecordInterface) => !oldIds.includes(record.oclcNumber),
      );
      return { ...state, records: state.records.concat(...newRecords) };
    }
    case 'remove': {
      if (action.new_records === undefined || action.new_records.length === 0) {
        return state;
      }
      const oldIds = state.records.map((record: BriefRecordInterface) => record.oclcNumber);
      const newRecords = action.new_records.filter(
        (record: BriefRecordInterface) => !oldIds.includes(record.oclcNumber),
      );
      return { ...state, records: newRecords };
    }
    case 'set': {
      return { ...state, records: action.new_records };
    }
    case 'reset': {
      return { ...state, records: [] };
    }
    default: {
      return state;
    }
  }
}

export const AppRecordsContext = createContext<RecordsSchema>({ records: [] });
export const AppRecordsDispatchContext = createContext<React.Dispatch<RecordsActionSchema>>(
  () => {},
);
