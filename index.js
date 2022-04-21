const { ipcRenderer } = require("electron");

/**
 * 
 * @param {String} tagName 
 * @param {String} id 
 * @param {String} className 
 * @param {*} style 
 * @returns {HTMLElement}
 */
function createElement (tagName, id, className, style) {
    /**@type {HTMLElement} */
    const elem = document.createElement(tagName);
    if (id) elem.id = id;
    if (className) elem.className = className;
    for (const i in style || {}) {
        elem.style.setProperty(i, style[i]);
    }
    return elem;
}

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
        return ipcRenderer.send("debug:log", args);
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
        Back : ["ArrowLeft", "Backspace"],
        Up : ["ArrowUp"],
        Down : ["ArrowDown"]
    }
};

// ElectronAPI.log("index begin");

const { TypeMap, Block, dbcontext } = require("./common_data");

// ElectronAPI.log("after require");

/**@type {HTMLDivElement} */
const MenuDiv = document.getElementById("block-menu");
/**@type {HTMLDivElement} */
const BlockArea = document.getElementById("block-area");
/**@type {HTMLTemplateElement} */
const Templates = document.getElementById("templates");

/**@type {Array<Block>} */
let blocks = [];
// /**@type {Array<String>} */
// let catagories = [];
let relations = {};

/**
 * @param {Block} block
 * @returns {String}
 */
function getName (block) {
    return (typeof block.name === "string" ? block.name : (use_programmer_names ? block.name.programmer : block.name.basic));
}

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

<div class="io-type-circle">
    <div class="io-type-circle-inner"></div>
</div>

/**
 * 
 * @param {Number} h 
 * @param {Number} s 
 * @param {Number} l
 * @returns {String} 
 */
 function hsl_to_rgb (h, s, l) {
    h = Math.floor(h);
    s = Math.floor(s*100)/100;
    l = Math.floor(l*100)/100;
    h = h % 360;
    if (h < 0) {
        h += 360;
    }
    const c = (1 - Math.abs(l * 2 - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let t = [];
    if (h < 60) {
        t = [c, x, 0];
    } else if (h < 120) {
        t = [x, c, 0];
    } else if (h < 180) {
        t = [0, c, x];
    } else if (h < 240) {
        t = [0, x, c];
    } else if (h < 300) {
        t = [x, 0, c];
    } else {
        t = [c, 0, x];
    }
    t = [Math.floor((t[0]+m)*255), Math.floor((t[1]+m)*255), Math.floor((t[2]+m)*255)];
    let co = "0123456789abcdef";
    return `#${co[(t[0]-(t[0]%16))/16]+co[t[0]%16]}${co[(t[1]-(t[1]%16))/16]+co[t[1]%16]}${co[(t[2]-(t[2]%16))/16]+co[t[2]%16]}`;
}

/**
 * 
 * @param {String} color 
 * @returns {{r:Number,g:Number,b:Number}}
 */
function parse_rgb_to_string (color) {
    console.log(color);
    if (color[0] == "#") {
        color = color.slice(1);
    }
    if (color.length === 3) {
        color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
    }
    t = "0123456789abcdef";
    return {r : t.indexOf(color[0])*16+t.indexOf(color[1]), g : t.indexOf(color[2])*16+t.indexOf(color[3]), b : t.indexOf(color[4])*16+t.indexOf(color[5])};
}

/**
 * 
 * @param {String} rgb 
 * @returns {{H:Number,S:Number,L:Number}}
 */
function rgb_to_hsl (rgb) {
    let { r, g, b } = parse_rgb_to_string(rgb);
    let r1 = r/255; let g1 = g/255; let b1 = b/255;
    const Cmax = Math.max(r1, g1, b1);
    const Cmin = Math.min(r1, g1, b1);
    const delta = Cmax - Cmin;
    const H = delta === 0 ? 0 : 60 * (Cmax === r1 ? (g1 - b1) / delta % 6 : Cmax === g1 ? (b1 - r1) / delta + 2 : (r1 - g1) / delta + 4);
    const L = (Cmax + Cmin) / 2;
    const S = delta === 0 ? 0 : delta / (1 - Math.abs(2 * L - 1));
    return {H, S, L};
}

/**
 * 
 * @param {String} color 
 * @returns {HTMLDivElement}
 */
function createBlockIOPort (color) {
    const outer = createElement("div", undefined, "io-type-circle", {"background":color});
    const {H, S, L} = rgb_to_hsl(color);
    const inner = createElement("div", undefined, "io-type-circle-inner", {"background":hsl_to_rgb(H, S, L-10)});
    outer.appendChild(inner);
    return outer;
}

/**
 * 
 * @param {Block} data 
 */
 function createBlock (x, y, data) {
    /**@type {HTMLDivElement} */
    const container = createElement("div", undefined, "block-container", {"--x":x, "--y":y});
    /**@type {HTMLSpanElement} */
    const titleArea = createElement("span", undefined, "block-title");
    titleArea.textContent = getName(data);
    container.appendChild(titleArea);
    BlockArea.appendChild(container);
}

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
        // ElectronAPI.log(o, options, typeof o);
        MenuDiv.appendChild(createBlockItem(typeof o === "string" ? o : getName(o), btn));
        // MenuDiv.appendChild(createBlockItem(typeof o === "string" ? o : ("programmer" in o ? (use_programmer_names ? o.programmer : o.basic) : typeof o.name === "string" ? o.name : (use_programmer_names ? o.name.programmer : o.name.basic)), btn));
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
    try {
        document.body.appendChild(createBlockIOPort("#0f0"));
    } catch (err) {
        await ElectronAPI.log(err);
        throw err;
    }
    blocks = await ElectronAPI.get_blocks();
    relations = await ElectronAPI.get_relations();
    await reload_bindings();
    ipcRenderer.on("event:binding-change", reload_bindings);
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
    // ElectronAPI.log(msel_bread_string.join("."), mapping[msel_bread_string.join(".")] || []);
    populateBlockMenu(mapping[msel_bread_string.join(".")] || [], false);
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
        if (msel < 0) {
            msel += MenuDiv.children.length;
        }
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
            } else {
                /**@type {Array<Block>} */
                let lst = mapping[msel_bread_string.join(".")] || [];
                for (let i = 0; i < lst.length; i ++) {
                    if (getName(lst[i]) === MenuDiv.children[msel].textContent) {
                        ElectronAPI.log(MenuDiv.style.getPropertyValue("--x"), MenuDiv.style.getPropertyValue("--y"));
                        createBlock(Number(MenuDiv.style.getPropertyValue("--x")) || 0, Number(MenuDiv.style.getPropertyValue("--y")) || 0, lst[i]);
                        break;
                    }
                }
                hide_block_menu();
            }
        }
    }
}