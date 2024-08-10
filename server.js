import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import { EventEmitter } from "events";


const hooksEmitter = new EventEmitter();
const insertAsync = Mongo.Collection.prototype.insertAsync;
const updateAsync = Mongo.Collection.prototype.updateAsync;
const removeAsync = Mongo.Collection.prototype.removeAsync;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

Object.assign(Mongo.Collection.prototype, {
  _insertDocFields: { $all: true },
  _updateDocFields: { $all: true },
  _removeDocFields: { $all: true },
  _fetchPrevious: false,
  _onBeforeInsert: null,

  async insertAsync(params, options) {
    if (this._onBeforeInsert) {
      await this._onBeforeInsert({ doc: params });
    }

    const res = await insertAsync.call(this, params, options);
    await delay(1000);
    const doc = await this.createQuery({
      $filters: { _id: res },

      ...(this._insertDocFields || { $all: true }),
    }).fetchOneAsync();

    const hookParams = {
      userId: Meteor.userId(),
      doc,
    };

    hooksEmitter.emit(`${this._name}::insert`, { ...hookParams });

    return res;
  },
  async updateAsync(query, params, options) {
    let previousDocs = [];

    if (this._fetchPrevious) {
      previousDocs = await this.createQuery({
        $filters: query,

        _id: true,
        ...(this._updateDocFields || { $all: true }),
      }).fetchAsync();
    }

    const res = await updateAsync.call(this, query, params, options);

    const hookParams = {
      userId: Meteor.userId(),
      removedCount: res,
    };

    const docs = await this.createQuery({
      $filters: query,

      _id: true,
      ...(this._updateDocFields || { $all: true }),
    }).fetchAsync();

    docs.forEach((doc) => {
      const previousDoc = previousDocs.find((previousDoc) => previousDoc._id === doc._id);

      hooksEmitter.emit(`${this._name}::update`, { ...hookParams, doc, previousDoc });
    });

    return res;
  },
  async removeAsync(params, options) {
    const docs = await this.createQuery({
      $filters: query,

      _id: true,
      ...(this._removeDocFields || { $all: true }),
    }).fetchAsync();

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
    if (options?.docFields) {
      this._insertDocFields = options.docFields;
    }

    hooksEmitter.on(`${this._name}::insert`, cb);
  },
  onUpdate(cb, options) {
    if (options?.docFields) {
      this._updateDocFields = options.docFields;
    }

    if (options.fetchPrevious) {
      this._fetchPrevious = options.fetchPrevious;
    }

    hooksEmitter.on(`${this._name}::update`, cb);
  },
  onRemove(cb, options) {
    if (options?.docFields) {
      this._removeDocFields = options.docFields;
    }

    hooksEmitter.on(`${this._name}::remove`, cb);
  }
});