import { StrictMode, useReducer } from 'react';
import './App.scss';
import AppRoutes from './routes';
import { AppRecordsContext, AppRecordsDispatchContext, appRecordsReducer, initialRecordsContextState  } from './context/RecordsContext';
import { AppSettingsContext, AppSettingsDispatchContext, appSettingsReducer, initialSettingsContextState } from './context/SettingsContext';

export default function App() {
  const [ searchSettings, settingsDispatch ] = useReducer(appSettingsReducer, initialSettingsContextState);
  const [ records, recordDispatch ] = useReducer(appRecordsReducer, initialRecordsContextState);
  return (
      <StrictMode>
        <AppSettingsContext.Provider value={searchSettings}>
          <AppSettingsDispatchContext.Provider value={settingsDispatch}>
            <AppRecordsContext.Provider value={records}>
              <AppRecordsDispatchContext.Provider value={recordDispatch}>
                <AppRoutes />
              </AppRecordsDispatchContext.Provider>
            </AppRecordsContext.Provider>
          </AppSettingsDispatchContext.Provider>
        </AppSettingsContext.Provider>
      </StrictMode>
  );
}
