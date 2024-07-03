// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { BriefRecordInterface } from '../renderer/interfaces/oclc_interfaces';

const electronHandler = {
  setStore(key: string, value: any) {
    ipcRenderer.send('store:set', key, value);
  },
  getStore(key: string) {
    return ipcRenderer.invoke('store:get', key);
  },
  exportFile(file: string[][]): Promise<string | undefined> {
    return ipcRenderer.invoke('file:export', file);
  },
  getBibHoldings(query: string, mmsId: string = ''): Promise<Array<BriefRecordInterface>> {
    return ipcRenderer.invoke('oclc:getBibHoldings', query, mmsId);
  },
  isLoggedIn(): Promise<boolean> {
    return ipcRenderer.invoke('auth:isLoggedIn');
  },
  login() {
    return ipcRenderer.send('auth:login');
  },
  logout() {
    return ipcRenderer.send('auth:logout');
  },
  writeLog(data: any, level: string) {
    ipcRenderer.send('log:write', data, level);
  },
  onTokenReceived(callback: (token: boolean) => void) {
    ipcRenderer.on('token:received', (_, token) => callback(token));
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
