import fs, { PathLike } from "fs";
import path from "path";
import EventEmitter from "events";
import { containsSpecialChars, toArray } from "./utils";
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

export default class AkivaDB<T extends object> extends EventEmitter {
  readonly root?: string;
  readonly file?: PathLike;

  private inMemory: boolean = false;
  private map: Record<string, DocPrivate<T>> = {};
  private list: Set<string> = new Set();

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
    if (options?.name && typeof options.name !== "string") {
      throw new AkivaDBError("Database name must be typeof string!", 0);
    }
    if (options?.name && containsSpecialChars(options.name)) {
      throw new AkivaDBError(DB_CONTAINS_SPECIAL_CHARS(options.name), 0);
    }

    if (!!options?.inMemory) {
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
   * Reset `map` and `list`.
   */
  private flush() {
    this.map = {};
    this.list = new Set();
  }

  private add(doc: DocPrivate<T>) {
    this.list.add(doc._id);
    this.map[doc._id] = doc;

    return doc;
  }

  private get(_id: string): DocPrivate<T> | null {
    const doc = this.map[_id];
    return !doc.$deleted ? doc : null;
  }

  private remove(_id: string) {
    this.list.delete(_id);
    delete this.map[_id];
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
    this.list.forEach((_id) => {
      try {
        const doc = this.get(_id);
        if (doc) data.push(JSON.stringify(doc));
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
   * Insert single document, returns created document.
   * @param newDoc
   * @param {{strict?: boolean}} options
   * @param {boolean} options.strict If `true`, rejects on failed insert
   * @returns {DocPrivate<T>} doc
   */
  insert(newDoc: Doc<T>, options?: { strict?: boolean }) {
    if (!isDoc(newDoc)) {
      if (options?.strict) return Promise.reject(INVALID_DOC(newDoc));
      return null;
    }

    if (!!newDoc?._id && this.list.has(newDoc._id.toString())) {
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
   */
  insertMany(docs: OneOrMore<Doc<T>>, options?: { strict?: boolean }) {
    return Promise.all(
      toArray(docs).map((newDoc) => this.insert(newDoc, options))
    ).then((docs) =>
      docs.reduce<Doc<T>[]>((acc, doc) => {
        if (doc !== null) acc.push(doc);
        return acc;
      }, [])
    );
  }

  /**
   * Add document to database and emit `insert`
   * @param {Doc<T>} doc
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
}
