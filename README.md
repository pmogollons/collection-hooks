# Meteor Collection Hooks

Extends Mongo.Collection with onInsert, onUpdate and onRemove hooks.

### Getting Started
Installation:

```meteor add matb33:collection-hooks```

All hooks run after the operation has completed, so you can safely modify the document in the hook without 
affecting the operation.

### onInsert
    
```javascript
Collection.onInsert(function ({ userId, doc }) {
    // Code here run after the insert operation has completed
}, {
  // You can set the doc fields the hook will receive. If not set, it will return all fields.
  docFields: {
    field1: 1,
    field2: 1
  }
});
```

### onUpdate

```javascript
Collection.onUpdate(function ({ userId, doc, previousDoc }) {
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
```

### onRemove

```javascript
Collection.onRemove(function ({ userId, doc }) {
    // Code here run after the remove operation has completed
}, {
  // You can set the doc fields the hook will receive. If not set, it will return all fields.
  docFields: {
    field1: 1,
    field2: 1
  }
});
```
