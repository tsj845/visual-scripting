const { ipcRenderer } = require("electron");

const use_programmer_names = true;

// used to keep event callbacks from accidentally crashing the program by trying to access an uninitialized value
let booted = false;

class ElectronAPI {
    /**
     * gets the code blocks that are currently defined
     * @returns {Promise<Array<Block>>}
     */
    static get_blocks () {
        return ipcRenderer.invoke("data:get_blocks");
    }
    /**
     * gets block catagories
     * @returns {Propise<Array<String>>}
     */
    static get_catagories () {
        return ipcRenderer.invoke("data:get_catagories");
    }
    static get_relations () {
        return ipcRenderer.invoke("data:get_relations");
    }
    static log (...args) {
        ipcRenderer.send("debug:log", args);
    }
}

// ElectronAPI.log("index begin");

const { TypeMap, Block, dbcontext } = require("./common_data");

// ElectronAPI.log("after require");

/**@type {HTMLDivElement} */
const MenuDiv = document.getElementById("block-menu");

/**@type {Array<Block>} */
let blocks = [];
// /**@type {Array<String>} */
// let catagories = [];
let relations = {};

// /**
//  * makes a block item for the sidebar
//  * @param {Block} block 
//  */
// function createBlockItem (block) {
//     /**@type {HTMLDivElement} */
//     const container = document.createElement("div");
//     container.className = "block-item";
//     /**@type {HTMLSpanElement} */
//     const desc = document.createElement("span");
//     desc.className = "block-item-desc";
//     /**@type {HTMLSpanElement} */
//     const name = document.createElement("span");
//     name.className = "block-item-name";
//     /**@type {HTMLSpanElement} */
//     const cata = document.createElement("span");
//     cata.className = "block-item-cata";
//     container.replaceChildren(name, cata, document.createElement("br"), desc);
//     name.textContent = use_programmer_names ? block.name.programmer : block.name.basic;
//     cata.textContent = block.category;
//     desc.textContent = block.description;
//     container.style.setProperty("--c", SidebarDiv.children.length);
//     return container;
// }

/**
 * creates an item for the block menu
 * @param {String} text
 * @returns {HTMLDivElement}
 */
function createBlockItem (text, doimg) {
    doimg = doimg === undefined ? true : doimg;
    /**@type {HTMLDivElement} */
    const container = document.createElement("div");
    container.className = "block-item";
    /**@type {HTMLSpanElement} */
    const span1 = document.createElement("span");
    span1.textContent = text;
    container.appendChild(span1);
    if (doimg) {
        /**@type {HTMLImageElement} */
        const img = document.createElement("img");
        img.src = "./next-img.svg";
        img.className = "next-img";
        container.appendChild(img);
    }
    return container;
}

/**
 * populates the block menu with options
 */
function populateBlockMenu (options, btn) {
    for (let i = 0; i < options.length; i ++) {
        const o = options[i];
        MenuDiv.appendChild(createBlockItem(typeof o === "string" ? o : (use_programmer_names ? o.programmer : o.basic), btn));
    }
}

/**@type {{String:Array<Block>}} */
let mapping = {};

async function main () {
    blocks = await ElectronAPI.get_blocks();
    relations = await ElectronAPI.get_relations();
    // const catagories = await ElectronAPI.get_catagories();
    for (let i = 0; i < blocks.length; i ++) {
        if (mapping[blocks[i].namespace] === undefined) {
            mapping[blocks[i].namespace] = [];
        }
        mapping[blocks[i].namespace].push(blocks[i]);
    }
    // ElectronAPI.log(relations);
    // ElectronAPI.log(mapping);
    juliedothething();
    booted = true;
}

main();

/**@type {Number} @description currently selection menu option */
let msel = 0;
/**@type {Array<Number>} @description breadcrumbs for sub menus */
let msel_bread = [];
/**@type {Array<String>} @description string path to current sub menu */
let msel_bread_string = [];

function juliedothething () {
    MenuDiv.replaceChildren();
    if (msel_bread.length === 0) {
        populateBlockMenu(Object.keys(relations));
        MenuDiv.children[0].classList.toggle("active");
        return;
    }
    let x = relations;
    for (let i = 0; i < msel_bread_string.length; i ++) {
        x = x[msel_bread_string[i]];
        if (x === null || x === undefined || x === "NULL") {
            break;
        }
    }
    // ElectronAPI.log(x);
    if (x !== "NULL") {
        populateBlockMenu(Object.keys(x));
    }
    // ElectronAPI.log(lst);
    populateBlockMenu(mapping[msel_bread_string.join(".")], false);
    // populateBlockMenu(lst);
    MenuDiv.children[0].classList.toggle("active");
}

document.addEventListener("keyup", (e) => {
    if (!booted) {
        return;
    }
    // ElectronAPI.log(msel, msel_bread, msel_bread_string);
    const key = e.code.toString();
    if (key === "ArrowDown" || key === "ArrowUp") {
        MenuDiv.children[msel].classList.toggle("active");
        msel += key === "ArrowDown" ? 1 : -1;
        msel %= MenuDiv.children.length;
        MenuDiv.children[msel].classList.toggle("active");
    } else if (key === "ArrowRight" || key === "ArrowLeft") {
        if (key === "ArrowLeft") {
            if (msel_bread.length > 0) {
                // walk back
                msel = msel_bread.pop();
                msel_bread_string.pop();
                juliedothething();
                MenuDiv.children[0].classList.toggle("active");
                // msel = msel_bread[msel_bread.length - 1];
                MenuDiv.children[msel].classList.toggle("active");
            }
        } else {
            // check for option being a terminator, then do stuff
            if (MenuDiv.children[msel].children.length > 1) {
                msel_bread.push(msel);
                msel_bread_string.push(MenuDiv.children[msel].children[0].textContent);
                juliedothething();
            }
        }
    }
});