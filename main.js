// for file io to communicate with rust code runner
const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
let screen;
const yaml = require("yaml");
const { TypeMap, Block, dbcontext } = require("./common_data");
// let screen;
// import { TypeMap, Block, dbcontext } from "./common_data";

function createWindow () {
    const win = new BrowserWindow({
        webPreferences : {
            // preload : path.join(__dirname, "preload.js"),
            nodeIntegration : true,
            contextIsolation : false,
        }
    });
    win.loadFile("index.html");
}

function createStarterWindow () {
    const size = screen.getPrimaryDisplay().workAreaSize;
    let h = Math.floor(size.height / 3 * 2);
    let w = Math.ceil(h * 1.5882352941);
    const pw = 800;
    const ph = 550;
    if (w > pw && h > ph) {
        w = pw;
        h = ph;
    }
    const win = new BrowserWindow({
        webPreferences : {
            preload : path.join(__dirname, "preload.js")
        },
        resizable : false,
        width : w,
        height : h
    });
    win.loadFile("./starter.html");
}

/**@type {Array<Block>} */
let block_list = [];

function reload_blocks () {
    block_list = [];
    let documents = yaml.parseAllDocuments(fs.readFileSync("./builtin_blocks.yaml", "utf-8"));
    const fmt = (x) => {
        let f = {};
        for (const i in x) {
            const v = x[i].value;
            f[x[i].key.value] = v.type === "PLAIN" ? v.value : fmt(v.items);
        }
        return f;
    };
    for (const i in documents) {
        const doc = documents[i];
        block_list.push(new Block(fmt(doc.contents.items)));
    }
}

reload_blocks();

/**
 * @returns {Array<Block>}
 */
function get_blocks () {
    console.log("get blocks");
    return block_list;
}

app.whenReady().then(() => {
    screen = require("electron").screen;
    createStarterWindow();

    ipcMain.handle("data:get_blocks", get_blocks);
    ipcMain.on("debug:log", (_, args) => {console.log(...args)});
    ipcMain.handle("test:invoke", () => {return "abcd"});
    ipcMain.on("window:make_main", createWindow);
    // ipcMain.handle("data:new_block");
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createStarterWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (dbcontext || process.platform !== "darwin") {
        app.quit();
    }
});