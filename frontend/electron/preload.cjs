const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  selectFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
});
