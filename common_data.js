/**@type {Boolean} */
const dbcontext = true;

/**
 * @class
 * @property {Array<String>} names
 * @property {Array<String>} types
 * @property {{String : String}} map
 */
class TypeMap {
    /**
     * - names - names of ports
     * - types - types of ports
     * @constructor
     * @param {Array<String>} [names] 
     * @param {Array<String>} [types] 
     */
    constructor (names, types) {
        this.names = names || [];
        this.types = types || [];
        this.map = {};
        if (this.names.length !== this.types.length) {
            throw "mismatched lengths for TypeMap construction";
        }
        for (const i in this.names) {
            if (this.names[i] in this.map) {
                throw "duplicate port name in TypeMap construction";
            }
            this.map[this.names[i]] = this.types[i];
        }
    }
    /**
     * - name - name of port
     * - type - type of port
     * @param {String} name 
     * @param {String} type 
     */
    push (name, type) {
        if (name === undefined || type === undefined) {
            throw "undefined name or type in TypeMap addition";
        }
        if (name in this.map) {
            throw "duplicate port name in TypeMap addition";
        }
        this.names.push(name);
        this.types.push(type);
        this.map[name] = type;
    }
    /**
     * - names - list of port names
     * - types - list of port types
     * @param {Array<String>} names 
     * @param {Array<String>} types 
     */
    extend (names, types) {
        if (names === undefined || types === undefined) {
            throw "undefined names of ports in TypeMap extension";
        }
        if (names.length !== types.length) {
            throw "mismatched number of port names and types in TypeMap extension";
        }
        for (const i in names) {
            if (names[i] in this.map) {
                throw "duplicate port name in TypeMap extension";
            }
            this.names.push(names[i]);
            this.types.push(types[i]);
            this.map[names[i]] = types[i];
        }
    }
}

/**
 * @class
 * @property {{programmer:String,basic:String}} name
 * @property {String} description
 * @property {String} category
 * @property {Number} controlflows
 * @property {TypeMap} inputs
 * @property {TypeMap} outputs
 * @property {String} opid
 */
class Block {
    /**
     * @constructor
     * @param {{name?:{programmer:String,basic:String},description?:String,category?:String,controlflows?:Number,inputs?:TypeMap,outputs?:TypeMap,opid:String}} [options] 
     */
    constructor (options) {
        // console.log(options);
        options = options || {};
        if (options.opid === undefined) {
            throw "invalid block opid";
        }
        this.name = options.name || "Block";
        this.description = options.description || "";
        this.category = options.category || "builtins";
        this.controlflows = options.controlflows || 0;
        this.inputs = options.inputs || new TypeMap();
        this.outputs = options.outputs || new TypeMap();
    }
}

// exports = {TypeMap, Block, dbcontext};
exports.TypeMap = TypeMap;
exports.Block = Block;
exports.dbcontext = dbcontext;