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
/**@type {Array<String>} */
let catas_list = [];

function reload_blocks () {
    block_list = [];
    let links = yaml.parseAllDocuments(fs.readFileSync("./linker.yaml", "utf-8"));
    const fmt = (x) => {
        const x1 = x;
        x = x.contents === undefined ? (x.items === undefined ? x : x.items) : x.contents.items;
        let f = {};
        for (const i in x) {
            const v = x[i].value;
            // console.log(v);
            f[x[i].key.value] = (v.type === "PLAIN" || v.type.indexOf("QUOTE") >= 0) ? v.value : fmt(v.items);
        }
        return f;
    };
    for (const i in links) {
        /**@type {{target:String,namespace:String}} */
        let link = fmt(links[i]);
        let documents = yaml.parseAllDocuments(fs.readFileSync(link.target, "utf-8"));
        const namespace = link.namespace;
        catas_list.push(namespace);
        for (const i in documents) {
            const doc = documents[i];
            // console.log(doc);
            let block = new Block(fmt(doc));
            // console.log(block.name);
            block.namespace = namespace;
            block_list.push(block);
        }
    }
}

reload_blocks();

/**
 * @returns {Array<Block>}
 */
function get_blocks () {
    return block_list;
}

/**
 * @returns {Array<String>}
 */
function get_catas () {
    return catas_list;
}

app.whenReady().then(() => {
    screen = require("electron").screen;
    createStarterWindow();

    ipcMain.handle("data:get_blocks", get_blocks);
    ipcMain.handle("data:get_catagories", get_catas);
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