import fs, { PathLike, statSync } from "fs";
import path from "path";
import EventEmitter from "events";
import {
  boolToNumber,
  containsSpecialChars,
  humanReadableFileSize,
  toArray,
} from "./utils";
import {
  Doc,
  DocPrivate,
  KeysOf,
  OneOrMore,
  Query,
  Update,
  Projection,
} from "./types";
import {
  isDoc,
  isDocPrivate,
  isId,
  isModifier,
  isQuery,
  isQueryMatch,
  isUpdate,
} from "./validators";
import { modify, project } from "./modifiers";
import {
  DB_CONTAINS_SPECIAL_CHARS,
  INVALID_DOC,
  INVALID_ID,
  INVALID_QUERY,
  INVALID_UPDATE,
  MEMORY_MODE,
} from "./errors";
import { generateUIDByTimestamp } from "./idGenerator";
import { AkivaDBError } from "./errorHandler";
import * as _ from "lodash";

export default class AkivaDB<T extends object> extends EventEmitter {
  readonly root?: string;
  readonly file?: PathLike;

  private inMemory: boolean = false;
  private map: Record<string, DocPrivate<T>> = {};
  private indexes: Set<string> = new Set();
  private dbName: string = "akivadb";

  /**
   * @param options.name - Database name, if empty, will run `AkivaDB` in-memory
   * @param options.root - Database path
   * @param options.disableAutoload - If true, disable automatic loading file data into memory
   * @param options.inMemory - If true, disables persistence to file
   */
  constructor(options?: {
    name?: string;
    root?: string;
    disableAutoload?: boolean;
    inMemory?: boolean;
  }) {
    super();
    this.dbName = !!options?.name ? options?.name : "akivadb";
    if (options?.name && typeof options.name !== "string") {
      throw new AkivaDBError("Database name must be typeof string!", 0);
    }
    if (options?.name && containsSpecialChars(options.name)) {
      throw new AkivaDBError(DB_CONTAINS_SPECIAL_CHARS(options.name), 0);
    }

    if (!!options?.inMemory || !!!options?.name || !!!options?.root) {
      this.inMemory = true;
    }

    if (options?.root) {
      fs.mkdirSync(options.root, { recursive: true });
      this.file = path.resolve(
        options.root,
        `${options?.name || "akivadb"}.akvdb`
      );
      if (!options?.disableAutoload) this.load();
    }
  }

  /**
   * Reset `map` and `indexes`.
   *
   * Remove all listeners.
   */
  private flush() {
    this.map = {};
    this.indexes = new Set();
    this.removeAllListeners();
  }

  private add(doc: DocPrivate<T>) {
    this.indexes.add(doc._id);
    this.map[doc._id] = doc;

    return doc;
  }

  private addMany(docs: Array<DocPrivate<T>>) {
    _.forEach(docs, (doc) => {
      this.indexes.add(doc._id);
      _.set(this.map, doc._id, doc);
    });

    return docs;
  }

  private get(_id: string): DocPrivate<T> | null {
    const doc = this.map[_id];
    return !doc?.$deleted ? doc : null;
  }

  private remove(_id: string) {
    this.indexes.delete(_id);
    delete this.map[_id];
  }

  public get name(): string {
    return this.dbName;
  }

  public get size(): number {
    return this.indexes.size;
  }

  public get version(): string {
    return require("../package.json").version;
  }

  public get fileSize(): string {
    if (this.inMemory) {
      return "N/A";
    } else {
      if (fs.existsSync(this.file)) {
        return humanReadableFileSize(statSync(this.file).size);
      } else {
        return humanReadableFileSize(0);
      }
    }
  }

  public get memoryMode(): string {
    return this.inMemory ? "memory" : "disk";
  }

  /**
   * Load persistent data into memory.
   * @param strict
   * @returns {string[]} List of documents
   */
  load(strict = false) {
    if (!this.file) throw new AkivaDBError(MEMORY_MODE("load"), 3);
    if (!fs.existsSync(this.file)) return [];

    this.flush();

    return fs
      .readFileSync(this.file, "utf-8")
      .split("\n")
      .filter((raw) => {
        try {
          const doc = JSON.parse(raw);
          if (!isDocPrivate<T>(doc)) {
            throw new AkivaDBError(INVALID_DOC(doc), 4);
          }

          this.add(doc);

          return false;
        } catch (err) {
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
    if (!this.file) throw new AkivaDBError(MEMORY_MODE("persist"), 3);

    const data: string[] = [];
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
      } catch (err) {
        this.remove(_id);

        if (strict) {
          throw err;
        }
      }
    });

    fs.writeFileSync(this.file, data.join("\n"));
  }

  /**
   * Drop the database.
   * @param {boolean} strict If `true` will delete the file on disk, else will reset the database.
   */
  drop(strict: boolean = false) {
    this.flush();
    if (!this.inMemory) {
      this.persist();
      if (strict && fs.existsSync(this.file)) {
        fs.unlinkSync(this.file);
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
  insert(newDoc: Doc<T>, options?: { strict?: boolean }) {
    if (!isDoc(newDoc)) {
      if (options?.strict) {
        return Promise.reject(new AkivaDBError(INVALID_DOC(newDoc), 1));
      }
      return null;
    }

    if (!!newDoc?._id && containsSpecialChars(newDoc._id)) {
      throw new AkivaDBError(`Id cannot contain special characters`, 1);
    }

    if (!!newDoc?._id && this.indexes.has(newDoc._id.toString())) {
      throw new AkivaDBError(`Id ${newDoc._id} already exists`, 1);
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
  insertMany(docs: OneOrMore<Doc<T>>, options?: { strict?: boolean }) {
    {
      docs = toArray(docs);
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
  findOne<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) {
      return Promise.reject(new AkivaDBError(INVALID_QUERY(query), 1));
    }

    for (let i = 0, ids = Array.from(this.indexes); i < ids.length; i += 1) {
      const doc = this._findDoc(ids[i], query, options?.projection);
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
  findById<P extends KeysOf<Doc<T>>>(
    id: OneOrMore<string>,
    options?: { projection?: P }
  ) {
    return Promise.all(
      toArray(id).map((_id) => this.findOneById(_id, options?.projection))
    ).then((docs) =>
      docs.reduce<Projection<DocPrivate<T>, P>[]>((acc, doc) => {
        if (doc !== null) {
          acc.push(doc);
        }
        return acc;
      }, [])
    );
  }

  /**
   * Find all matching documents.
   * @param {Query} query
   * @param {{projection?: P}} options
   * @param {Array<string>} options.projection
   * @returns {DocPrivate<T>[]} documents
   * @todo add sort to options
   */
  find<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) {
      return Promise.reject(new AkivaDBError(INVALID_QUERY(query), 1));
    }

    const docs = Array.from(this.indexes).reduce<
      Projection<DocPrivate<T>, P>[]
    >((acc, _id) => {
      const doc = this._findDoc(_id, query, options?.projection);
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
  findOneById<P extends KeysOf<Doc<T>>>(_id: string, projection?: P) {
    if (!isId(_id)) return Promise.reject(new AkivaDBError(INVALID_ID(_id), 1));

    const doc = this.get(_id);
    if (doc) {
      if (projection) {
        return Promise.resolve(project(doc, projection));
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
  async deleteOneById(id: string) {
    if (!isId(id)) {
      return Promise.reject(new AkivaDBError(INVALID_ID(id), 1));
    }

    const doc = await this.findOneById(id);

    if (!!!doc) {
      return Promise.resolve(false);
    }

    this._deleteDoc(doc);
    return Promise.resolve(true);
  }

  /**
   * Delete document(s) by id.
   * @param docs document(s)
   * @returns {Promise<number>} 1 or 0
   * @todo return array of deleted ids
   */
  deleteById(docs: OneOrMore<string>) {
    return Promise.all(
      toArray(docs).map((_id) => this.deleteOneById(_id))
    ).then((n) => n.reduce<number>((acc, cur) => acc + boolToNumber(cur), 0));
  }

  /**
   * Delete single document
   * @param {Query} query
   * @returns {Promise<boolean>} boolean
   */
  async deleteOne(query: Query = {}) {
    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(false);

    this._deleteDoc(doc);
    return Promise.resolve(true);
  }

  /**
   * Delete many documents. will delete all if no query is passed.
   * @param {Query} query
   * @returns {Promise<number>} deletedCount
   * @todo retrun array of deleted documents
   */
  async deleteMany(query: Query = {}) {
    return this.find(query).then((docs) =>
      docs.reduce<number>((acc, cur) => {
        this._deleteDoc(cur);
        return acc + 1;
      }, 0)
    );
  }

  /**
   * Update single document by ID
   * @param {string} _id Document id
   * @param {Update<T>} update
   * @param {{projection?: P}} options
   * @param {Array<string>} options.projection
   * @returns {Promise<DocPrivate>} document
   */
  async updateOneById<P extends KeysOf<Doc<T>>>(
    _id: string,
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isId(_id)) return Promise.reject(new AkivaDBError(INVALID_ID(_id), 1));
    if (!isUpdate(update))
      return Promise.reject(new AkivaDBError(INVALID_UPDATE(update), 1));

    const doc = await this.findOneById(_id);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._updateDoc(doc, update);
    if (options?.projection)
      return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  /**
   * Update document(s) by id.
   * @param {OneOrMore<string>} x Document id(s)
   * @param {Update<T>} update
   * @param {{projection?: P}} options
   * @param {Array<string>} options.projection
   * @returns {Promise<Array<DocPrivate>>} documents
   */
  updateById<P extends KeysOf<Doc<T>>>(
    x: OneOrMore<string>,
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isUpdate(update))
      return Promise.reject(new AkivaDBError(INVALID_UPDATE(update), 1));
    return Promise.all(
      toArray(x).map((_id) => this.updateOneById(_id, update, options))
    ).then((docs) =>
      docs.reduce<Doc<T>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, [])
    );
  }

  /**
   * Update single document matching query
   * @param {Query} query
   * @param {Update<T>} update
   * @param {{projection?: P}} options
   * @param {Array<string>} options.projection
   * @returns {Promise<DocPrivate>} document
   */
  async updateOne<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query))
      return Promise.reject(new AkivaDBError(INVALID_QUERY(query), 1));
    if (!isUpdate(update))
      return Promise.reject(new AkivaDBError(INVALID_UPDATE(update), 1));

    const doc = await this.findOne(query);
    if (!doc) return Promise.resolve(null);

    const newDoc = this._updateDoc(doc, update);
    if (options?.projection)
      return Promise.resolve(project(newDoc, options.projection));
    return Promise.resolve(newDoc);
  }

  /**
   * Update all documents matching query
   * @param {Query} query
   * @param {Update<T>} update
   * @param {{projection?: P}} options
   * @param {Array<string>} options.projection
   * @returns {Promise<Array<DocPrivate>>} document
   */
  updateMany<P extends KeysOf<Doc<T>>>(
    query: Query = {},
    update: Update<T> = {},
    options?: { projection?: P }
  ) {
    if (!isQuery(query)) {
      return Promise.reject(new AkivaDBError(INVALID_QUERY(query), 1));
    }
    if (!isUpdate(update)) {
      return Promise.reject(new AkivaDBError(INVALID_UPDATE(update), 1));
    }

    const newDocs = this.find(query).then((docs) =>
      docs.map((doc) => {
        const newDoc = this._updateDoc(doc, update);
        if (options?.projection) return project(newDoc, options.projection);
        return newDoc;
      })
    );

    return Promise.resolve(newDocs);
  }

  /**
   * Add document to database and emit `insert`
   * @param {Doc<T>} doc Document
   * @returns {DocPrivate<T>} doc
   */
  private _addAndEmit = (doc: Doc<T>): DocPrivate<T> => {
    const x = {
      ...doc,
      _id: !!doc._id ? doc._id.toString() : generateUIDByTimestamp(),
    };
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
  private _addManyAndEmit = (docs: Array<Doc<T>>): Array<DocPrivate<T>> => {
    const arr = _.map(docs, (x) => {
      return _.assign(x, {
        _id: !!x._id ? x._id.toString() : generateUIDByTimestamp(),
      });
    });
    this.addMany(arr);

    this.emit("insertMany", arr);
    if (this.inMemory == false) {
      this.persist();
    }
    return arr;
  };

  /**
   * Mark document as deleted against persistence.
   * @param doc document
   */
  private _deleteDoc(doc: DocPrivate<T>) {
    this.map[doc._id] = { ...doc, $deleted: true };
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
  private _findDoc<P extends KeysOf<Doc<T>>>(
    _id: string,
    query: Query,
    projection?: P
  ) {
    const doc = this.get(_id);

    if (doc && isQueryMatch(doc, query)) {
      if (projection) return project(doc, projection);
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
  private _updateDoc(doc: DocPrivate<T>, update: Update<T>) {
    const newDoc = isModifier(update)
      ? modify(doc, update)
      : { ...update, _id: doc._id };

    this.map[doc._id] = newDoc;

    this.emit("update", newDoc);
    if (this.inMemory == false) {
      this.persist();
    }
    return newDoc;
  }
}

