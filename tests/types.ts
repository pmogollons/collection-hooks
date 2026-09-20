import type { NpmModuleMongodb } from "meteor/npm-mongo";
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

declare const TransformedCollection: Mongo.Collection<{ _id: string; value: number }, { _id: string; value: string }>;

declare const TestCollection: Mongo.Collection<TestDocument, TestDocument>;

// This block is compiled as a type test but never registers runtime hooks.
if (false) {
  TestCollection.insertAsync(
    { title: "inserted", omitted: false, nested: { selected: 1, omitted: "nested" }, items: [], nullable: null },
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
    ({ doc, previousDoc, modifier }) => {
      modifier satisfies NpmModuleMongodb.UpdateFilter<TestDocument>;
      modifier.$set?.omitted satisfies boolean | undefined;
      // @ts-expect-error Modifier fields retain their stored types.
      modifier.$set = { omitted: "invalid" };
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

  TestCollection.onBeforeUpdate(({ modifier }) => {
    modifier satisfies NpmModuleMongodb.UpdateFilter<TestDocument>;
    modifier.$set?.title satisfies string | undefined;
    // @ts-expect-error Modifier fields retain their stored types.
    modifier.$set = { title: 123 };
  });

  TransformedCollection.onUpdate(({ doc, modifier }) => {
    doc.value satisfies string;
    modifier.$set?.value satisfies number | undefined;
    // @ts-expect-error Modifiers use the stored document, not its transformation.
    modifier.$set = { value: "invalid" };
  });

  TransformedCollection.onBeforeUpdate(({ doc, modifier }) => {
    doc.value satisfies string | undefined;
    modifier.$set?.value satisfies number | undefined;
    modifier.$inc = { value: 1 };
    // @ts-expect-error Modifiers use the stored document, not its transformation.
    modifier.$set = { value: "invalid" };
  });

  TestCollection.onInsert((params) => {
    // @ts-expect-error Insert hooks do not receive a modifier.
    void params.modifier;
  });
  TestCollection.onBeforeInsert((params) => {
    // @ts-expect-error Before-insert hooks do not receive a modifier.
    void params.modifier;
  });
  TestCollection.onRemove((params) => {
    // @ts-expect-error Remove hooks do not receive a modifier.
    void params.modifier;
  });

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
