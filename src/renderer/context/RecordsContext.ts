import React, { createContext } from 'react'
import { BriefRecordInterface } from '../interfaces/oclc_interfaces'

export type RecordsSchema = {
  'records': Array<BriefRecordInterface>,
};

export type RecordsActionSchema = {
  'new_records': Array<BriefRecordInterface>,
  'type': string,
};

export const initialRecordsContextState = {
  'records': [],
};

export function appRecordsReducer(state: RecordsSchema, action: RecordsActionSchema) {
  console.log({'state': state, 'new_records': action.new_records, 'type': action.type})
  switch (action.type) {
    case 'add': {
      const oldIds = state.records.map((record: BriefRecordInterface) => record.oclcNumber)
      const newRecords = action.new_records.filter((record: BriefRecordInterface) => !oldIds.includes(record.oclcNumber))
      return {...state, 'records': state.records.concat(...newRecords)};
    } 
    case 'remove': {
      const oldIds = state.records.map((record: BriefRecordInterface) => record.oclcNumber)
      const newRecords = action.new_records.filter((record: BriefRecordInterface) => !oldIds.includes(record.oclcNumber))
      return {...state, 'records': newRecords};
    }
    case 'set': {
      return {...state, 'records': action.new_records};
    } 
    case 'reset': {
      return {...state, 'records': []};
    }
    default: {
      return state;
    }
  }
}

export const AppRecordsContext = createContext<RecordsSchema|null>(null);
export const AppRecordsDispatchContext = createContext<React.Dispatch<RecordsActionSchema>|null>(null);
