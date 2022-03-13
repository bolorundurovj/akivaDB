"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mid = void 0;
const fs_1 = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = __importDefault(require("events"));
const utils_1 = require("./utils");
const validators_1 = require("./validators");
const modifiers_1 = require("./modifiers");
const errors_1 = require("./errors");
const idGenerator_1 = require("./idGenerator");
const errorHandler_1 = require("./errorHandler");
const _ = __importStar(require("lodash"));
class AkivaDB extends events_1.default {
    /**
     * @param options.name - Database name, if empty, will run `AkivaDB` in-memory
     * @param options.root - Database path
     * @param options.disableAutoload - If true, disable automatic loading file data into memory
     * @param options.inMemory - If true, disables persistence to file
     */
    constructor(options) {
        super();
        this.inMemory = false;
        this.map = {};
        this.indexes = new Set();
        this.dbName = "akivadb";
        /**
         * Add document to database and emit `insert`
         * @param {Doc<T>} doc Document
         * @returns {DocPrivate<T>} doc
         */
        this._addAndEmit = (doc) => {
            const x = Object.assign(Object.assign({}, doc), { _id: !!doc._id ? doc._id.toString() : (0, idGenerator_1.generateUIDByTimestamp)() });
            this.add(x);
            this.emit("insert", x);
            if (this.inMemory == false) {
                this.persist();
            }
            return x;
        };
        /**
         * Add documents to database and emit `insert`
         * @param {Array<Doc<T>>} docs Documents
         * @returns {Array<DocPrivate<T>>} docs
         */
        this._addManyAndEmit = (docs) => {
            const arr = _.map(docs, (x) => {
                return _.assign(x, {
                    _id: !!x._id ? x._id.toString() : (0, idGenerator_1.generateUIDByTimestamp)(),
                });
            });
            this.addMany(arr);
            this.emit("insertMany", arr);
            if (this.inMemory == false) {
                this.persist();
            }
            return arr;
        };
        this.dbName = !!(options === null || options === void 0 ? void 0 : options.name) ? options === null || options === void 0 ? void 0 : options.name : "akivadb";
        if ((options === null || options === void 0 ? void 0 : options.name) && typeof options.name !== "string") {
            throw new errorHandler_1.AkivaDBError("Database name must be typeof string!", 0);
        }
        if ((options === null || options === void 0 ? void 0 : options.name) && (0, utils_1.containsSpecialChars)(options.name)) {
            throw new errorHandler_1.AkivaDBError((0, errors_1.DB_CONTAINS_SPECIAL_CHARS)(options.name), 0);
        }
        if (!!(options === null || options === void 0 ? void 0 : options.inMemory) || !!!(options === null || options === void 0 ? void 0 : options.name) || !!!(options === null || options === void 0 ? void 0 : options.root)) {
            this.inMemory = true;
        }
        if (options === null || options === void 0 ? void 0 : options.root) {
            fs_1.default.mkdirSync(options.root, { recursive: true });
            this.file = path_1.default.resolve(options.root, `${(options === null || options === void 0 ? void 0 : options.name) || "akivadb"}.akvdb`);
            if (!(options === null || options === void 0 ? void 0 : options.disableAutoload))
                this.load();
        }
    }
    /**
     * Reset `map` and `indexes`.
     *
     * Remove all listeners.
     */
    flush() {
        this.map = {};
        this.indexes = new Set();
        this.removeAllListeners();
    }
    add(doc) {
        this.indexes.add(doc._id);
        this.map[doc._id] = doc;
        return doc;
    }
    addMany(docs) {
        _.forEach(docs, (doc) => {
            this.indexes.add(doc._id);
            _.set(this.map, doc._id, doc);
        });
        return docs;
    }
    get(_id) {
        const doc = this.map[_id];
        return !(doc === null || doc === void 0 ? void 0 : doc.$deleted) ? doc : null;
    }
    remove(_id) {
        this.indexes.delete(_id);
        delete this.map[_id];
    }
    get name() {
        return this.dbName;
    }
    get size() {
        return this.indexes.size;
    }
    get version() {
        return require("../package.json").version;
    }
    get fileSize() {
        if (this.inMemory) {
            return "N/A";
        }
        else {
            if (fs_1.default.existsSync(this.file)) {
                return (0, utils_1.humanReadableFileSize)((0, fs_1.statSync)(this.file).size);
            }
            else {
                return (0, utils_1.humanReadableFileSize)(0);
            }
        }
    }
    get memoryMode() {
        return this.inMemory ? "memory" : "disk";
    }
    /**
     * Load persistent data into memory.
     * @param strict
     * @returns {string[]} List of documents
     */
    load(strict = false) {
        if (!this.file)
            throw new errorHandler_1.AkivaDBError((0, errors_1.MEMORY_MODE)("load"), 3);
        if (!fs_1.default.existsSync(this.file))
            return [];
        this.flush();
        return fs_1.default
            .readFileSync(this.file, "utf-8")
            .split("\n")
            .filter((raw) => {
            try {
                const doc = JSON.parse(raw);
                if (!(0, validators_1.isDocPrivate)(doc)) {
                    throw new errorHandler_1.AkivaDBError((0, errors_1.INVALID_DOC)(doc), 4);
                }
                this.add(doc);
                return false;
            }
            catch (err) {
                if (strict) {
                    throw err;
                }
                return true;
            }
        });
    }
    /**
     * Persist to database file.
     *
     * Any documents marked for deletion will be cleaned up here.
     * If `strict` is enabled, this will throw an error if persisting fails.
     * @param {boolean} strict
     */
    persist(strict = false) {
        if (!this.file)
            throw new errorHandler_1.AkivaDBError((0, errors_1.MEMORY_MODE)("persist"), 3);
        const data = [];
        // _.forEach(this.indexes, (_id: string) => {
        //   try {
        //     const doc = this.get(_id);
        //     if (doc) {
        //       data.push(JSON.stringify(doc));
        //     }
        //   } catch (err) {
        //     this.remove(_id);
        //     if (strict) {
        //       throw err;
        //     }
        //   }
        // });
        this.indexes.forEach((_id) => {
            try {
                const doc = this.get(_id);
                if (doc) {
                    data.push(JSON.stringify(doc));
                }
            }
            catch (err) {
                this.remove(_id);
                if (strict) {
                    throw err;
                }
            }
        });
        fs_1.default.writeFileSync(this.file, data.join("\n"));
    }
    /**
     * Drop the database.
     * @param {boolean} strict If `true` will delete the file on disk, else will reset the database.
     */
    drop(strict = false) {
        this.flush();
        if (!this.inMemory) {
            this.persist();
            if (strict && fs_1.default.existsSync(this.file)) {
                fs_1.default.unlinkSync(this.file);
            }
        }
    }
    /**
     * Insert single document, returns created document.
     * @param newDoc
     * @param {{strict?: boolean}} options
     * @param {boolean} options.strict If `true`, rejects on failed insert
     * @returns {Promise<DocPrivate<T>>} doc
     * @todo optimize processing time
     */
    insert(newDoc, options) {
        if (!(0, validators_1.isDoc)(newDoc)) {
            if (options === null || options === void 0 ? void 0 : options.strict) {
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_DOC)(newDoc), 1));
            }
            return null;
        }
        if (!!(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id) && (0, utils_1.containsSpecialChars)(newDoc._id)) {
            throw new errorHandler_1.AkivaDBError(`Id cannot contain special characters`, 1);
        }
        if (!!(newDoc === null || newDoc === void 0 ? void 0 : newDoc._id) && this.indexes.has(newDoc._id.toString())) {
            throw new errorHandler_1.AkivaDBError(`Id ${newDoc._id} already exists`, 1);
        }
        return Promise.resolve(this._addAndEmit(newDoc));
    }
    /**
     * Insert a document or multiple documents.
     * @param docs document(s)
     * @param {{strict?: boolean}} options
     * @param {boolean} options.strict If `true`, rejects on first failed insert
     * @returns documents
     * @todo optimize processing time
     */
    insertMany(docs, options) {
        {
            docs = (0, utils_1.toArray)(docs);
            return Promise.resolve(this._addManyAndEmit(docs));
        }
    }
    /**
     * Find single document.
     * @param {Query} query
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {DocPrivate<T>} document
     */
    findOne(query = {}, options) {
        if (!(0, validators_1.isQuery)(query)) {
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_QUERY)(query), 1));
        }
        for (let i = 0, ids = Array.from(this.indexes); i < ids.length; i += 1) {
            const doc = this._findDoc(ids[i], query, options === null || options === void 0 ? void 0 : options.projection);
            if (doc) {
                return Promise.resolve(doc);
            }
        }
        return Promise.resolve(null);
    }
    /**
     * Find document(s) by id.
     * @param id  ID(s)
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {Promise<DocPrivate<T>[]>} documents
     */
    findById(id, options) {
        return Promise.all((0, utils_1.toArray)(id).map((_id) => this.findOneById(_id, options === null || options === void 0 ? void 0 : options.projection))).then((docs) => docs.reduce((acc, doc) => {
            if (doc !== null) {
                acc.push(doc);
            }
            return acc;
        }, []));
    }
    /**
     * Find all matching documents.
     * @param {Query} query
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {DocPrivate<T>[]} documents
     * @todo add sort to options
     */
    find(query = {}, options) {
        if (!(0, validators_1.isQuery)(query)) {
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_QUERY)(query), 1));
        }
        const docs = Array.from(this.indexes).reduce((acc, _id) => {
            const doc = this._findDoc(_id, query, options === null || options === void 0 ? void 0 : options.projection);
            if (doc) {
                acc.push(doc);
            }
            return acc;
        }, []);
        return Promise.resolve(docs);
    }
    /**
     * Retrieve document by id.
     * @param {string} _id Document ID
     * @param {Query} query Query Object
     * @param {P} projection Projection Array
     * @returns doc
     */
    findOneById(_id, projection) {
        if (!(0, validators_1.isId)(_id))
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_ID)(_id), 1));
        const doc = this.get(_id);
        if (doc) {
            if (projection) {
                return Promise.resolve((0, modifiers_1.project)(doc, projection));
            }
            return Promise.resolve(doc);
        }
        return Promise.resolve(null);
    }
    /**
     * Delete a document by ID.
     * @param id document id
     * @returns {Promise<boolean>} boolean
     */
    deleteOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, validators_1.isId)(id)) {
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_ID)(id), 1));
            }
            const doc = yield this.findOneById(id);
            if (!!!doc) {
                return Promise.resolve(false);
            }
            this._deleteDoc(doc);
            return Promise.resolve(true);
        });
    }
    /**
     * Delete document(s) by id.
     * @param docs document(s)
     * @returns {Promise<number>} 1 or 0
     * @todo return array of deleted ids
     */
    deleteById(docs) {
        return Promise.all((0, utils_1.toArray)(docs).map((_id) => this.deleteOneById(_id))).then((n) => n.reduce((acc, cur) => acc + (0, utils_1.boolToNumber)(cur), 0));
    }
    /**
     * Delete single document
     * @param {Query} query
     * @returns {Promise<boolean>} boolean
     */
    deleteOne(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.findOne(query);
            if (!doc)
                return Promise.resolve(false);
            this._deleteDoc(doc);
            return Promise.resolve(true);
        });
    }
    /**
     * Delete many documents. will delete all if no query is passed.
     * @param {Query} query
     * @returns {Promise<number>} deletedCount
     * @todo retrun array of deleted documents
     */
    deleteMany(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find(query).then((docs) => docs.reduce((acc, cur) => {
                this._deleteDoc(cur);
                return acc + 1;
            }, 0));
        });
    }
    /**
     * Update single document by ID
     * @param {string} _id Document id
     * @param {Update<T>} update
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {Promise<DocPrivate>} document
     */
    updateOneById(_id, update = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, validators_1.isId)(_id))
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_ID)(_id), 1));
            if (!(0, validators_1.isUpdate)(update))
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_UPDATE)(update), 1));
            const doc = yield this.findOneById(_id);
            if (!doc)
                return Promise.resolve(null);
            const newDoc = this._updateDoc(doc, update);
            if (options === null || options === void 0 ? void 0 : options.projection)
                return Promise.resolve((0, modifiers_1.project)(newDoc, options.projection));
            return Promise.resolve(newDoc);
        });
    }
    /**
     * Update document(s) by id.
     * @param {OneOrMore<string>} x Document id(s)
     * @param {Update<T>} update
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {Promise<Array<DocPrivate>>} documents
     */
    updateById(x, update = {}, options) {
        if (!(0, validators_1.isUpdate)(update))
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_UPDATE)(update), 1));
        return Promise.all((0, utils_1.toArray)(x).map((_id) => this.updateOneById(_id, update, options))).then((docs) => docs.reduce((acc, doc) => {
            if (doc !== null)
                acc.push(doc);
            return acc;
        }, []));
    }
    /**
     * Update single document matching query
     * @param {Query} query
     * @param {Update<T>} update
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {Promise<DocPrivate>} document
     */
    updateOne(query = {}, update = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, validators_1.isQuery)(query))
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_QUERY)(query), 1));
            if (!(0, validators_1.isUpdate)(update))
                return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_UPDATE)(update), 1));
            const doc = yield this.findOne(query);
            if (!doc)
                return Promise.resolve(null);
            const newDoc = this._updateDoc(doc, update);
            if (options === null || options === void 0 ? void 0 : options.projection)
                return Promise.resolve((0, modifiers_1.project)(newDoc, options.projection));
            return Promise.resolve(newDoc);
        });
    }
    /**
     * Update all documents matching query
     * @param {Query} query
     * @param {Update<T>} update
     * @param {{projection?: P}} options
     * @param {Array<string>} options.projection
     * @returns {Promise<Array<DocPrivate>>} document
     */
    updateMany(query = {}, update = {}, options) {
        if (!(0, validators_1.isQuery)(query)) {
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_QUERY)(query), 1));
        }
        if (!(0, validators_1.isUpdate)(update)) {
            return Promise.reject(new errorHandler_1.AkivaDBError((0, errors_1.INVALID_UPDATE)(update), 1));
        }
        const newDocs = this.find(query).then((docs) => docs.map((doc) => {
            const newDoc = this._updateDoc(doc, update);
            if (options === null || options === void 0 ? void 0 : options.projection)
                return (0, modifiers_1.project)(newDoc, options.projection);
            return newDoc;
        }));
        return Promise.resolve(newDocs);
    }
    /**
     * Mark document as deleted against persistence.
     * @param doc document
     */
    _deleteDoc(doc) {
        this.map[doc._id] = Object.assign(Object.assign({}, doc), { $deleted: true });
        this.emit("delete", doc);
        if (this.inMemory == false) {
            this.persist();
        }
    }
    /**
     * Retrieve document and match query.
     * @param {string} _id Document ID
     * @param {Query} query Query Object
     * @param {P} projection Projection Array
     * @todo Parse data types
     * @returns doc
     */
    _findDoc(_id, query, projection) {
        const doc = this.get(_id);
        if (doc && (0, validators_1.isQueryMatch)(doc, query)) {
            if (projection)
                return (0, modifiers_1.project)(doc, projection);
            return doc;
        }
        return null;
    }
    /**
     * Update document
     * @param {DocPrivate<T>} doc Document
     * @param {Update<T>} update
     * @returns {DocPrivate<T>} document
     * @todo update only passed fields not entire document
     */
    _updateDoc(doc, update) {
        const newDoc = (0, validators_1.isModifier)(update)
            ? (0, modifiers_1.modify)(doc, update)
            : Object.assign(Object.assign({}, update), { _id: doc._id });
        this.map[doc._id] = newDoc;
        this.emit("update", newDoc);
        if (this.inMemory == false) {
            this.persist();
        }
        return newDoc;
    }
}
exports.default = AkivaDB;
const mid = (req, res, next) => {
    if (/^\/akivadb/i.test(String(req.path)) &&
        /^\/akivadb/i.test(String(req.originalUrl))) {
        if (req.method == "GET" &&
            /^\/akivadb\/login/i.test(String(req.path)) &&
            /^\/akivadb\/login/i.test(String(req.originalUrl))) {
            res.send("post login");
        }
        else {
            const file = path_1.default.join(__dirname, "..", "pages", "login.html");
            const content = fs_1.default.readFileSync(file, { encoding: "utf8", flag: "r" });
            res.send(content);
        }
    }
    next();
};
exports.mid = mid;
//# sourceMappingURL=main.js.map