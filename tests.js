import { Mongo } from "meteor/mongo";
import { Tinytest } from "meteor/tinytest";


const CODE = 111;

const getCode = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(CODE);
    }, 500);
  });
};


Tinytest.addAsync("CollectionHooks - onBeforeInsert async hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);

  TestCollection.onBeforeInsert(async ({ doc }) => {
    doc.code = await getCode();
    test.equal(doc.name, "Test Document");
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(CODE, doc.code);
});

Tinytest.addAsync("CollectionHooks - onInsert hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc = false;

  TestCollection.onInsert(({ doc }) => {
    hookDoc = doc;
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  test.equal(hookDoc.name, "Test Document");
  test.isTrue(docId, "Expected document to be inserted and return an ID");
});

Tinytest.addAsync("CollectionHooks - onInsert hook is called with docFields", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc = false;

  TestCollection.onInsert(({ doc }) => {
    hookDoc = doc;
  }, {
    docFields: { _id: 1 },
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  test.isTrue(hookDoc._id, docId);
  test.equal(hookDoc.name, undefined);
  test.isTrue(docId, "Expected document to be inserted and return an ID");
});

Tinytest.addAsync("CollectionHooks - onUpdate hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc = false;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onUpdate(({ doc }) => {
    hookDoc = doc;
  });

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document" } });

  test.equal(hookDoc.name, "Updated Document");
});

Tinytest.addAsync("CollectionHooks - onUpdate hook is called with docFields", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc = false;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onUpdate(({ doc }) => {
    hookDoc = doc;
  }, {
    docFields: { _id: 1 },
  });

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document" } });

  test.isTrue(hookDoc._id, docId);
  test.equal(hookDoc.name, undefined);
});

Tinytest.addAsync("CollectionHooks - onUpdate hook is called with docFields and previousDoc", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;
  let hookPreviousDoc;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onUpdate(({ doc, previousDoc }) => {
    hookDoc = doc;
    hookPreviousDoc = previousDoc;
  }, {
    docFields: { miaw: 1 },
    fetchPrevious: true,
  });

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document", miaw: "miaw" } });

  test.equal(hookDoc._id, docId);
  test.equal(hookDoc.miaw, "miaw");
  test.equal(hookPreviousDoc._id, docId);
  test.equal(hookPreviousDoc.miaw, undefined);
});

Tinytest.addAsync("CollectionHooks - onRemove hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onRemove(({ doc }) => {
    hookDoc = doc;
  });

  await TestCollection.removeAsync({ _id: docId });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(hookDoc._id, docId);
  test.equal(hookDoc.name, "Test Document");
  test.equal(doc, undefined);
});

Tinytest.addAsync("CollectionHooks - onRemove hook is called with docFields", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onRemove(({ doc }) => {
    hookDoc = doc;
  }, {
    docFields: { _id: 1 },
  });

  await TestCollection.removeAsync({ _id: docId });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(hookDoc._id, docId);
  test.equal(hookDoc.name, undefined);
  test.equal(doc, undefined);
});
