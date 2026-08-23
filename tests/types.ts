import { Mongo } from "meteor/mongo";


type TestDocument = {
  _id: string;
  title: string;
  omitted: boolean;
  nested: {
    selected: number;
    omitted: string;
  };
  items: Array<{
    selected: string;
    omitted: number;
  }>;
  optional?: {
    selected: string;
    omitted: number;
  };
  nullable: {
    selected: string;
    omitted: number;
  } | null;
};

declare const TestCollection: Mongo.Collection<TestDocument, TestDocument>;

// This block is compiled as a type test but never registers runtime hooks.
if (false) {
  TestCollection.insertAsync(
    { title: "inserted", omitted: false, nested: { selected: 1, omitted: "nested" }, items: [] },
    { skipHooks: true },
  ) satisfies Promise<string>;

  TestCollection.updateAsync(
    { _id: "document-id" },
    { $set: { title: "updated" } },
    {
      multi: true,
      upsert: false,
      arrayFilters: [{ "item.selected": "selected" }],
      skipHooks: true,
    },
  ) satisfies Promise<number>;

  TestCollection.upsertAsync(
    { _id: "document-id" },
    { $set: { title: "upserted" } },
    { multi: false, skipHooks: true },
  ) satisfies Promise<{ numberAffected?: number; insertedId?: string }>;

  TestCollection.removeAsync({ _id: "document-id" }, { skipHooks: false }) satisfies Promise<number>;

  // @ts-expect-error skipHooks must be boolean when supplied.
  TestCollection.updateAsync({ _id: "document-id" }, { $set: { title: "invalid" } }, { skipHooks: "yes" });

  // @ts-expect-error The collection-hooks package only extends async mutations.
  TestCollection.update({ _id: "document-id" }, { $set: { title: "invalid" } }, { skipHooks: true });

  TestCollection.onInsert(({ doc }) => {
    doc._id satisfies string;
    doc.title satisfies string;
    doc.omitted satisfies boolean;
  });

  TestCollection.onInsert(
    ({ doc }) => {
      doc._id satisfies string;
      doc.title satisfies string;
      doc.nested.selected satisfies number;
      doc.items[0].selected satisfies string;
      doc.optional?.selected satisfies string | undefined;
      doc.nullable?.selected satisfies string | undefined;

      // @ts-expect-error Fields omitted from docFields are not available.
      doc.omitted;
      // @ts-expect-error Nested fields omitted from docFields are not available.
      doc.nested.omitted;
      // @ts-expect-error Array element fields omitted from docFields are not available.
      doc.items[0].omitted;
    },
    {
      docFields: {
        title: true,
        nested: { selected: 1 },
        items: { selected: true },
        optional: { selected: true },
        nullable: { selected: true },
      },
    },
  );

  TestCollection.onUpdate(
    ({ doc, previousDoc }) => {
      doc._id satisfies string;
      previousDoc._id satisfies string;
      previousDoc.title satisfies string;

      // @ts-expect-error previousDoc uses the same projection as doc.
      previousDoc.omitted;
    },
    { docFields: { title: true }, fetchPrevious: true },
  );

  TestCollection.onUpdate(({ previousDoc }) => {
    // @ts-expect-error previousDoc remains optional without fetchPrevious: true.
    previousDoc.title;
  });

  TestCollection.onRemove(
    ({ doc }) => {
      doc.omitted satisfies boolean;
      doc.nested.omitted satisfies string;
    },
    { docFields: { $all: true } },
  );

  const dynamicDocFields: { [field: string]: boolean } = { title: true };

  TestCollection.onInsert(
    ({ doc }) => {
      doc.omitted satisfies boolean;
    },
    { docFields: dynamicDocFields },
  );

  TestCollection.onInsert(
    ({ doc }) => {
      doc.title satisfies string;
    },
    { docFields: { omitted: -1 } },
  );
}
