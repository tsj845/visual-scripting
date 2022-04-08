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
/**@type {Array<String>} */
let catagories = [];

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
function createBlockItem (text) {
    /**@type {HTMLDivElement} */
    const container = document.createElement("div");
    container.className = "block-item";
    /**@type {HTMLSpanElement} */
    const span1 = document.createElement("span");
    span1.textContent = text;
    /**@type {HTMLImageElement} */
    const img = document.createElement("img");
    img.src = "./next-img.svg";
    img.className = "next-img";
    container.replaceChildren(span1, img);
    return container;
}

/**
 * populates the block menu with options
 */
function populateBlockMenu (options) {
    for (let i = 0; i < options.length; i ++) {
        MenuDiv.appendChild(createBlockItem(options[i]));
    }
}

async function main () {
    blocks = await ElectronAPI.get_blocks();
    catagories = await ElectronAPI.get_catagories();
    ElectronAPI.log(catagories);
    populateBlockMenu(catagories);
    MenuDiv.children[0].classList.toggle("active");
    ElectronAPI.log(MenuDiv.children.length);
    booted = true;
}

main();

/**@type {Number} @description currently selection menu option */
let msel = 0;
/**@type {Array<Number>} @description breadcrumbs for sub menus */
let msel_bread = [];

document.addEventListener("keyup", (e) => {
    if (!booted) {
        return;
    }
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
            }
        } else {
            // check for option being a terminator, then do stuff
        }
    }
});