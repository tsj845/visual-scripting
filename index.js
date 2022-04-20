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
    static get_bindings () {
        return ipcRenderer.invoke("data:get_bindings");
    }
    static log (...args) {
        ipcRenderer.send("debug:log", args);
    }
}

/**
 * @property {{Show : [String], Quit : [String], Accept : [String], Back : [String], Up : [String], Down : [String]}} BlockMenu
 */
let InputBindings = {
    BlockMenu : {
        Show : ["KeyA"],
        Quit : ["Escape"],
        Accept : ["ArrowRight", "Enter"],
        Back : ["ArrowLeft"],
        Up : ["ArrowUp"],
        Down : ["ArrowDown"]
    }
};

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

async function reload_bindings () {
    let res = await ElectronAPI.get_bindings();
    if (res === null) {
        return;
    }
    const pf1 = (target, match) => {
        // ElectronAPI.log(target, match);
        if (typeof target === "string" || Array.isArray(target)) {
            return true;
        }
        for (const cat in target) {
            if (cat in match) {
                if (pf1(target[cat], match[cat])) {
                    target[cat] = match[cat];
                }
            }
        }
        return false;
    }
    pf1(InputBindings, res);
    // ElectronAPI.log(InputBindings);
    // for (const cat in InputBindings) {
    //     if (cat in res) {}
    // }
    // InputBindings = inputbindsres || InputBindings;
}

async function main () {
    blocks = await ElectronAPI.get_blocks();
    relations = await ElectronAPI.get_relations();
    await reload_bindings();
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
    MenuDiv.hidden = true;
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
        msel = 0;
        msel_bread_string = [];
        populateBlockMenu(Object.keys(relations));
        MenuDiv.children[0].classList.toggle("active");
        return;
    }
    let x = relations;
    for (let i = 0; i < msel_bread_string.length; i ++) {
        x = x[msel_bread_string[i]];
        // ElectronAPI.log(x);
        if (x === null || x === undefined || x === "NULL") {
            break;
        }
    }
    // ElectronAPI.log(x);
    if (x !== "NULL") {
        populateBlockMenu(Object.keys(x));
    }
    // ElectronAPI.log(msel_bread_string);
    ElectronAPI.log(mapping[msel_bread_string.join(".")]);
    populateBlockMenu(mapping[msel_bread_string.join(".")], false);
    // populateBlockMenu(lst);
    MenuDiv.children[0].classList.toggle("active");
}

let cursor = {x : 0, y : 0};

document.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
});

let block_menu_open = false;

function show_block_menu (x, y) {
    MenuDiv.hidden = false;
    if (x + MenuDiv.clientWidth > window.innerWidth) {
        x -= MenuDiv.clientWidth;
    }
    if (y + MenuDiv.clientHeight > window.innerHeight) {
        y -= MenuDiv.clientHeight;
    }
    MenuDiv.style.setProperty("--x", x);
    MenuDiv.style.setProperty("--y", y);
    block_menu_open = true;
}

function hide_block_menu () {
    msel_bread = [];
    juliedothething();
    MenuDiv.hidden = true;
    block_menu_open = false;
}

document.addEventListener("keyup", (e) => {
    if (!booted) {
        return;
    }
    // ElectronAPI.log(msel, msel_bread, msel_bread_string);
    const key = e.code.toString();
    if (block_menu_open) {
        if (InputBindings.BlockMenu.Show.includes(key)) {
            hide_block_menu();
            show_block_menu(cursor.x, cursor.y);
        } else {
            block_menu_key(key);
        }
        return;
    }
    if (InputBindings.BlockMenu.Show.includes(key)) {
        show_block_menu(cursor.x, cursor.y);
    }
});

function block_menu_key (key) {
    if (InputBindings.BlockMenu.Quit.includes(key)) {
        hide_block_menu();
        return;
    }
    if (InputBindings.BlockMenu.Up.includes(key) || InputBindings.BlockMenu.Down.includes(key)) {
        MenuDiv.children[msel].classList.toggle("active");
        msel += InputBindings.BlockMenu.Down.includes(key) ? 1 : -1;
        msel %= MenuDiv.children.length;
        MenuDiv.children[msel].classList.toggle("active");
    } else if (InputBindings.BlockMenu.Accept.includes(key) || InputBindings.BlockMenu.Back.includes(key)) {
        if (InputBindings.BlockMenu.Back.includes(key)) {
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
                msel = 0;
                juliedothething();
            }
        }
    }
}