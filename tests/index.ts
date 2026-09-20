import { Mongo } from "meteor/mongo";
// @ts-expect-error - no types for tinytest
import { Tinytest } from "meteor/tinytest";

import { CollectionHooks } from "../src/server";
import "./types";


const CODE = 111;

const getCode = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(CODE);
    }, 50);
  });
};


Tinytest.addAsync("CollectionHooks - onBeforeInsert async hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);

  const removeListener = TestCollection.onBeforeInsert(async ({ doc }) => {
    doc.code = await getCode();
    test.equal(doc.name, "Test Document");
  });

  const removeListener2 = TestCollection.onBeforeInsert(async ({ doc }) => {
    doc.miaw = "miaw";
    test.equal(doc.name, "Test Document");
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(CODE, doc?.code);
  test.equal("miaw", doc?.miaw);

  removeListener();
  removeListener2();
});

Tinytest.addAsync("CollectionHooks - onInsert hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  TestCollection.onInsert(({ doc }) => {
    hookDoc = doc;
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  test.equal(hookDoc?.name, "Test Document");
  test.isTrue(docId, "Expected document to be inserted and return an ID");
});

Tinytest.addAsync("CollectionHooks - onInsert hook is called with docFields", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  TestCollection.onInsert(({ doc }) => {
    hookDoc = doc;
  }, {
    docFields: { _id: 1 },
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  test.isTrue(hookDoc?._id, docId);
  test.equal(hookDoc?.name, undefined);
  test.isTrue(docId, "Expected document to be inserted and return an ID");
});

Tinytest.addAsync("CollectionHooks - onUpdate hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onUpdate(({ doc }) => {
    hookDoc = doc;
  });

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document" } });

  test.equal(hookDoc?.name, "Updated Document");
});

Tinytest.addAsync("CollectionHooks - onUpdate hook is called with docFields", async function (test) {
  const TestCollection = new Mongo.Collection(null);
  let hookDoc;

  const docId = await TestCollection.insertAsync({ name: "Test Document" });

  TestCollection.onUpdate(({ doc }) => {
    hookDoc = doc;
  }, {
    docFields: { _id: 1 },
  });

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document" } });

  test.isTrue(hookDoc?._id, docId);
  test.equal(hookDoc?.name, undefined);
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

  test.equal(hookDoc?._id, docId);
  test.equal(hookDoc?.miaw, "miaw");
  test.equal(hookPreviousDoc?._id, docId);
  test.equal(hookPreviousDoc?.miaw, undefined);
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

  test.equal(hookDoc?._id, docId);
  test.equal(hookDoc?.name, "Test Document");
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

  test.equal(hookDoc?._id, docId);
  test.equal(hookDoc?.name, undefined);
  test.equal(doc, undefined);
});

Tinytest.addAsync("CollectionHooks - onError global async hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);

  const removeListener = TestCollection.onInsert(async () => {
    throw new Error("Test Error");
  });

  const removeListener2 = CollectionHooks.onError((error) => {
    test.equal(error.message, "Test Error");
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(doc?._id, docId);
  test.equal(doc?.name, "Test Document");

  removeListener();
  removeListener2();
});

Tinytest.addAsync("CollectionHooks - onError global sync hook is called", async function (test) {
  const TestCollection = new Mongo.Collection(null);

  const removeListener = TestCollection.onInsert(() => {
    throw new Error("Test Error");
  });

  const removeListener2 = CollectionHooks.onError((error) => {
    test.equal(error.message, "Test Error");
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.equal(doc?._id, docId);
  test.equal(doc?.name, "Test Document");

  removeListener();
  removeListener2();
});

Tinytest.addAsync("CollectionHooks - onBeforeUpdate hook is called", async function (test) {
  const TestCollection = new Mongo.Collection("test");

  const removeListener = TestCollection.onBeforeUpdate(async ({ doc }) => {
    doc.code = await getCode();
  });

  const docId = await TestCollection.insertAsync({ name: "Test Document" });
  const doc = await TestCollection.findOneAsync({ _id: docId });

  test.isUndefined(doc?.code);

  await TestCollection.updateAsync({ _id: docId }, { $set: { name: "Updated Document" } });
  const doc2 = await TestCollection.findOneAsync({ _id: docId });

  test.equal(CODE, doc2?.code);

  removeListener();
});

Tinytest.addAsync("CollectionHooks - update hooks receive the full modifier", async function (test) {
  const collection = new Mongo.Collection<{ _id: string; name: string; count: number }>("modifier-hook-test");
  const docId = await collection.insertAsync({ name: "original", count: 0 });
  let beforeCalls = 0;
  let afterCalls = 0;
  let expectedModifier: Mongo.Modifier<{ _id: string; name: string; count: number }>;

  const removeBefore = collection.onBeforeUpdate(({ modifier }) => {
    beforeCalls++;
    test.isTrue(modifier === expectedModifier);
  });
  const removeAfter = collection.onUpdate(({ modifier }) => {
    afterCalls++;
    test.equal(modifier, expectedModifier);
  });

  try {
    expectedModifier = { $set: { name: "updated" }, $inc: { count: 1 } };
    await collection.updateAsync(docId, expectedModifier);
    expectedModifier = { $inc: { count: 2 } };
    await collection.updateAsync(docId, expectedModifier);
    test.equal(beforeCalls, 2);
    test.equal(afterCalls, 2);
    test.equal((await collection.findOneAsync(docId))?.count, 3);
  } finally {
    removeBefore();
    removeAfter();
    await collection.removeAsync(docId);
  }
});
