import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import { EventEmitter } from "events";


const hooksEmitter = new EventEmitter({ captureRejections: true });
const insertAsync = Mongo.Collection.prototype.insertAsync;
const updateAsync = Mongo.Collection.prototype.updateAsync;
const removeAsync = Mongo.Collection.prototype.removeAsync;
const config = {
  _insertDocFields: {},
  _updateDocFields: {},
  _removeDocFields: {},
  _fetchPrevious: false,
  _onBeforeInsert: [],
};

Object.assign(Mongo.Collection.prototype, {
  ...config,

  async insertAsync(params, options) {
    if (options?.skipHooks) {
      return await insertAsync.call(this, params, options);
    }

    if (this._onBeforeInsert?.length > 0) {
      const hookParams = {
        userId: this._getUserId(),
        doc: params,
      };

      for (const cb of this._onBeforeInsert) {
        await cb(hookParams);
      }
    }

    const res = await insertAsync.call(this, params, options);

    if (!hooksEmitter.listenerCount(`${this._name}::insert`)) {
      return res;
    }

    const doc = await this._fetchHookDoc({ _id: res }, this._insertDocFields, options);

    const hookParams = {
      userId: this._getUserId(),
      doc,
    };

    try {
      hooksEmitter.emit(`${this._name}::insert`, hookParams);
    } catch (error) {
      hooksEmitter.emit("error", error);
    }

    return res;
  },
  async updateAsync(query, params, options) {
    if (options?.skipHooks || !hooksEmitter.listenerCount(`${this._name}::update`)) {
      return await updateAsync.call(this, query, params, options);
    }

    let previousDocs = [];

    if (this._fetchPrevious) {
      previousDocs = await this._fetchHookDocs(query, this._updateDocFields, options);
    }

    const res = await updateAsync.call(this, query, params, options);

    const hookParams = {
      userId: this._getUserId(),
      updatedCount: res,
    };

    const docs = await this._fetchHookDocs(query, this._updateDocFields, options);

    docs.forEach((doc) => {
      const previousDoc = previousDocs.find((previousDoc) => previousDoc._id === doc._id);

      try {
        hooksEmitter.emit(`${this._name}::update`, { ...hookParams, doc, previousDoc });
      } catch (error) {
        hooksEmitter.emit("error", error);
      }
    });

    return res;
  },
  async removeAsync(params, options) {
    if (options?.skipHooks || !hooksEmitter.listenerCount(`${this._name}::remove`)) {
      return await removeAsync.call(this, params, options);
    }

    const docs = await this._fetchHookDocs(params, this._removeDocFields, options);

    const res = await removeAsync.call(this, params, options);

    const hookParams = {
      userId: this._getUserId(),
      removedCount: res,
    };

    docs.forEach((doc) => {
      try {
        hooksEmitter.emit(`${this._name}::remove`, { ...hookParams, doc });
      } catch (error) {
        hooksEmitter.emit("error", error);
      }
    });

    return res;
  },

  onBeforeInsert(cb) {
    this._onBeforeInsert.push(cb);

    return () => this._onBeforeInsert.splice(this._onBeforeInsert.length - 1, 1);
  },
  onInsert(cb, options) {
    if (options?.docFields) {
      this._insertDocFields = Object.assign({ _id: true }, this._insertDocFields || {}, options.docFields);
    }

    hooksEmitter.on(`${this._name}::insert`, cb);

    return () => hooksEmitter.removeListener(`${this._name}::insert`, cb);
  },
  onUpdate(cb, options) {
    if (options?.docFields) {
      this._updateDocFields = Object.assign({ _id: true }, this._updateDocFields || {}, options.docFields);
    }

    if (options?.fetchPrevious) {
      this._fetchPrevious = options.fetchPrevious;
    }

    hooksEmitter.on(`${this._name}::update`, cb);

    return () => hooksEmitter.removeListener(`${this._name}::update`, cb);
  },
  onRemove(cb, options) {
    if (options?.docFields) {
      this._removeDocFields = Object.assign({ _id: true }, this._removeDocFields || {}, options.docFields);
    }

    hooksEmitter.on(`${this._name}::remove`, cb);

    return () => hooksEmitter.removeListener(`${this._name}::remove`, cb);
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
  _getUserId() {
    try {
      return Meteor.userId();
    } catch {
      return undefined;
    }
  },
});

hooksEmitter.on("error", (err) => {
  console.error("Hooks emitter error");
  console.error(err);
});

export const CollectionHooks = {
  _hooksEmitter: hooksEmitter,
  onError(callback) {
    if (typeof callback === "function") {
      hooksEmitter.on("error", callback);

      return () => hooksEmitter.removeListener("error", callback);
    }

    return undefined;
  },
};