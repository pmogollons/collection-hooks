# Meteor Collection Hooks

Extends Mongo.Collection with onInsert, onUpdate and onRemove hooks.

### Getting Started
Installation:

```meteor add pmogollons:collection-hooks```

All hooks run after the operation has completed, so you can safely modify the document in the hook without
affecting the operation.

### onInsert

```javascript
const removeOnInsert = Collection.onInsert(function ({ userId, doc }) {
    // Code here run after the insert operation has completed
}, {
  // You can set the doc fields the hook will receive. If not set, it will return all fields.
  docFields: {
    field1: 1,
    field2: 1
  }
});

// You can remove the hook with the returned function
removeOnInsert();
```

### onUpdate

```javascript
const removeOnUpdate = Collection.onUpdate(function ({ userId, doc, previousDoc }) {
    // Code here run after the update operation has completed
}, {
  // You can set the doc fields the hook will receive. If not set, it will return all fields.
  docFields: {
    field1: 1,
    field2: 1
  },
  // If set to true, the hook will receive the previous document
  fetchPrevious: true
});

// You can remove the hook with the returned function
removeOnUpdate();
```

### onRemove

```javascript
const removeOnRemove = Collection.onRemove(function ({ userId, doc }) {
    // Code here run after the remove operation has completed
}, {
  // You can set the doc fields the hook will receive. If not set, it will return all fields.
  docFields: {
    field1: 1,
    field2: 1
  }
});

// You can remove the hook with the returned function
removeOnRemove();
```

### onBeforeInsert

```javascript
const removeOnBeforeInsert = Collection.onBeforeInsert(function ({ userId, doc }) {
  // Code here runs before the insert operation has completed. Any changes to the doc are persisted in the db.
  // You can throw here to cancel the op
});

// You can remove the hook with the returned function
removeOnBeforeInsert();
```

### Direct access (circumventing hooks)

```javascript
Collection.insertAsync(doc, { skipHooks: true });
Collection.updateAsync(query, mod, { skipHooks: true });
Collection.removeAsync(query, { skipHooks: true });
```

### Error handling on hooks (except onBeforeInsert)

Errors thrown inside any hook are caught and emitted as a global event that you can listen to.

```javascript
CollectionHooks.onError((err) => {
  // Do something with the error
  console.error("Error on hook", err);
});
```

### Hooks emitter

You can access the emitter directly. Is not recommended to use it unless you know what you are doing.

```javascript
CollectionHooks._hooksEmitter;
```

### Why only onBeforeInsert?
Well we didn't had the use case for the other before hooks and didn't want to add more complexity to the package.

### Additional notes
* If you throw an error on the onBeforeInsert hook the insert operation will be cancelled.
* By default, previousDoc is not fetched on onUpdate. If you want to fetch it, set fetchPrevious to true.
* If you want to fetch only specific fields on the doc, set the docFields option to the mongo projection you want to fetch.
* It is quite normal for userId to sometimes be unavailable to hook callbacks in some circumstances.
  For example, if an update is fired from the server with no user context, the server certainly won't be able to
  provide any particular userId.
* Hooks can only be defined on the server.
* Hooks fetch the docs on insert, update and remove operations. So for each op you will get one more op for
  fetching docs and one more if you want to fetch the previous doc on update.