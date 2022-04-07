const { ipcRenderer } = require("electron");

class ElectronAPI {
    /**
     * gets the code blocks that are currently defined
     * @returns {Promise<Array<Any>>}
     */
    static get_blocks () {
        return ipcRenderer.invoke("data:get_blocks");
        // return window.ELECTRONAPIS.get_blocks();
    }
    static log (...args) {
        ipcRenderer.send("debug:log", args);
        // window.ELECTRONAPIS.log(args);
    }
    static test_invoke () {
        return ipcRenderer.invoke("test:invoke");
        // return window.ELECTRONAPIS.test_invoke();
    }
}

// ElectronAPI.log("index begin");

const { TypeMap, Block, dbcontext } = require("./common_data");

// ElectronAPI.log("after require");

/**@type {HTMLDivElement} */
const SidebarDiv = document.getElementById("block-sidebar");

/**@type {Array<Block>} */
let blocks = [];

/**
 * makes a block item for the sidebar
 * @param {Block} block 
 */
function createBlockItem (block) {
    /**@type {HTMLDivElement} */
    const container = document.createElement("div");
    container.className = "block-item";
    /**@type {HTMLSpanElement} */
    const desc = document.createElement("span");
    desc.className = "block-item-desc";
    /**@type {HTMLSpanElement} */
    const name = document.createElement("span");
    name.className = "block-item-name";
    /**@type {HTMLSpanElement} */
    const cata = document.createElement("span");
    cata.className = "block-item-cata";
    container.replaceChildren(name, cata, document.createElement("br"), desc);
    name.textContent = block.name.programmer;
    cata.textContent = block.category;
    desc.textContent = block.description;
    return container;
}

/**
 * populates the sidebar with blocks
 */
function populateSidebar () {
    for (let i = 0; i < blocks.length; i ++) {
        SidebarDiv.appendChild(createBlockItem(blocks[i]));
    }
}

async function main () {
    // ElectronAPI.log("main start");
    blocks = await ElectronAPI.get_blocks();
    // ElectronAPI.log(blocks);
    populateSidebar();
}

main();