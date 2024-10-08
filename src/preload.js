const os = require('os');
const path = require('path');
const Toastify = require('toastify-js');
const { contextBridge, webUtils, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('os', {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld('Toastify', {
  toast: (options) => Toastify(options).showToast(),
});

contextBridge.exposeInMainWorld('electron', {
  pathToFile: (data) => webUtils.getPathForFile(data),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});