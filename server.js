import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import { EventEmitter } from "events";


const hooksEmitter = new EventEmitter({ captureRejections: true });
const insertAsync = Mongo.Collection.prototype.insertAsync;
const updateAsync = Mongo.Collection.prototype.updateAsync;
const removeAsync = Mongo.Collection.prototype.removeAsync;

Object.assign(Mongo.Collection.prototype, {
  _insertDocFields: { $all: true },
  _updateDocFields: { $all: true },
  _removeDocFields: { $all: true },
  _fetchPrevious: false,
  _onBeforeInsert: null,
  _hasInsertHooks: false,
  _hasUpdateHooks: false,
  _hasRemoveHooks: false,

  async insertAsync(params, options) {
    if (options?.skipHooks) {
      return await insertAsync.call(this, params, options);
    }

    if (this._onBeforeInsert) {
      await this._onBeforeInsert({ doc: params });
    }

    const res = await insertAsync.call(this, params, options);

    if (!this._hasInsertHooks) {
      return res;
    }

    const doc = await this._fetchHookDoc({ _id: res }, this._insertDocFields, options);

    const hookParams = {
      userId: Meteor.userId(),
      doc,
    };

    hooksEmitter.emit(`${this._name}::insert`, { ...hookParams });

    return res;
  },
  async updateAsync(query, params, options) {
    if (options?.skipHooks || !this._hasUpdateHooks) {
      return await updateAsync.call(this, query, params, options);
    }

    let previousDocs = [];

    if (this._fetchPrevious) {
      previousDocs = await this._fetchHookDocs(query, this._updateDocFields, options);
    }

    const res = await updateAsync.call(this, query, params, options);

    const hookParams = {
      userId: Meteor.userId(),
      removedCount: res,
    };

    const docs = await this._fetchHookDocs(query, this._updateDocFields, options);

    docs.forEach((doc) => {
      const previousDoc = previousDocs.find((previousDoc) => previousDoc._id === doc._id);

      hooksEmitter.emit(`${this._name}::update`, { ...hookParams, doc, previousDoc });
    });

    return res;
  },
  async removeAsync(params, options) {
    if (options?.skipHooks || !this._hasRemoveHooks) {
      return await removeAsync.call(this, params, options);
    }

    const docs = await this._fetchHookDocs(params, this._removeDocFields, options);

    const res = await removeAsync.call(this, params, options);

    const hookParams = {
      userId: Meteor.userId(),
      removedCount: res,
    };

    docs.forEach((doc) => {
      hooksEmitter.emit(`${this._name}::remove`, { ...hookParams, doc });
    });

    return res;
  },

  async onBeforeInsert(cb) {
    this._onBeforeInsert = cb;
  },
  onInsert(cb, options) {
    this._hasInsertHooks = true;

    if (options?.docFields) {
      this._insertDocFields = options.docFields;
    }

    hooksEmitter.on(`${this._name}::insert`, cb);
  },
  onUpdate(cb, options) {
    this._hasUpdateHooks = true;

    if (options?.docFields) {
      this._updateDocFields = options.docFields;
    }

    if (options?.fetchPrevious) {
      this._fetchPrevious = options.fetchPrevious;
    }

    hooksEmitter.on(`${this._name}::update`, cb);
  },
  onRemove(cb, options) {
    this._hasRemoveHooks = true;

    if (options?.docFields) {
      this._removeDocFields = options.docFields;
    }

    hooksEmitter.on(`${this._name}::remove`, cb);
  },

  async _fetchHookDoc(query, fields, options) {
    if (this.createQuery) {
      return await this.createQuery({
        $filters: query,

        _id: true,
        ...(fields || { $all: true }),
      }, { session: options?.session }).fetchOneAsync();
    }

    return this.findOneAsync(query, { projection: fields }, options);
  },
  async _fetchHookDocs(query, fields, options) {
    if (this.createQuery) {
      return await this.createQuery({
        $filters: query,

        _id: true,
        ...(fields || { $all: true }),
      }, { session: options?.session }).fetchAsync();
    }

    return this.find(query, { projection: fields }, options).fetchAsync();
  },
});

hooksEmitter.on("error", (err) => {
  console.error("Hooks emitter error");
  console.error(err);
});

export const CollectionHooks = {
  onError(callback) {
    if (typeof callback === "function") {
      hooksEmitter.on("error", callback);
    }
  },
};