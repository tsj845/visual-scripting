const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("ELECTRONAPIS", {
    get_blocks : () => ipcRenderer.invoke("data:get_blocks"),
    log : (args) => ipcRenderer.send("debug:log", args),
    test_invoke : () => ipcRenderer.invoke("test:invoke"),
    make_main : () => ipcRenderer.send("window:make_main"),
});