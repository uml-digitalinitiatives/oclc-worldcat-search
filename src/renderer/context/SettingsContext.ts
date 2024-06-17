import { createContext } from 'react';

export type SettingsSchema = {
  'search': {
    'searchType': string,
    'searchNumber': string,
  },
};

export type SettingsActionSchema = {
  'value': string | boolean,
  'type': string,
};

export const initialSettingsDispatchContextState = {
  type: '',
  value: '',
};

export const initialSettingsContextState = {
  search: {
    searchType: 'singleForm',
    searchNumber: 'oclc',
  },
};

export const AppSettingsContext = createContext<SettingsSchema>(initialSettingsContextState);
export const AppSettingsDispatchContext = createContext<React.Dispatch<SettingsActionSchema>>(
  () => {},
);

export const appSettingsReducer = (state: SettingsSchema, action: SettingsActionSchema) => {
  console.log({ state, value: action.value, type: action.type });
  switch (action.type) {
    case 'set_searchType': {
      return { ...state, search: { ...state.search, searchType: action.value as string } };
    }
    case 'set_searchNumber': {
      return { ...state, search: { ...state.search, searchNumber: action.value as string } };
    }
    case 'reset_settings': {
      return initialSettingsContextState;
    }
    default: {
      return state;
    }
  }
};
