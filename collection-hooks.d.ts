import type { EventEmitter } from "events";
import type { NpmModuleMongodb } from "meteor/npm-mongo";
import type * as m from "meteor/mongo";

type HookRemoveFunction = () => void;

type Deps = {
  [field: string]: boolean | 1 | -1 | Deps;
};

type IsAny<T> = 0 extends 1 & T ? true : false;

type IsExactInclusionEntry<T> = [T] extends [true | 1]
  ? true
  : T extends Deps
    ? IsExactInclusionProjection<T>
    : false;

type IsExactInclusionProjection<T extends Deps> = string extends keyof T
  ? false
  : false extends {
        [K in keyof T]-?: IsExactInclusionEntry<T[K]>;
      }[keyof T]
    ? false
    : true;

type ProjectNestedValue<T, TDocFields extends Deps> = T extends unknown[]
  ? Array<ProjectNestedValue<T[number], TDocFields>>
  : T extends readonly unknown[]
    ? ReadonlyArray<ProjectNestedValue<T[number], TDocFields>>
    : T extends object
      ? ProjectObject<T, TDocFields, false>
      : T;

type ProjectObject<T, TDocFields extends Deps, TIncludeId extends boolean> = {
  [K in keyof T as K extends keyof TDocFields
    ? K
    : TIncludeId extends true
      ? K extends "_id"
        ? K
        : never
      : never]: K extends keyof TDocFields
    ? TDocFields[K] extends Deps
      ? ProjectNestedValue<T[K], TDocFields[K]>
      : T[K]
    : T[K];
};

type ProjectDocument<T, TDocFields extends Deps | undefined> = IsAny<T> extends true
  ? T
  : TDocFields extends Deps
    ? TDocFields extends { $all: true | 1 }
      ? T
      : IsExactInclusionProjection<TDocFields> extends true
        ? ProjectObject<T, TDocFields, true>
        : T
    : T;

export const CollectionHooks: {
  _hooksEmitter: EventEmitter;
  onError(callback: (error: Error) => void): HookRemoveFunction;
};

declare module "meteor/mongo" {
  type HookParams<
    U,
    TDocFields extends Deps | undefined = undefined,
    TFetchPrevious extends boolean = false,
  > = {
    doc: ProjectDocument<U, TDocFields>;
    userId?: string;
  } & (TFetchPrevious extends true
    ? { previousDoc: ProjectDocument<U, TDocFields> }
    : { previousDoc?: ProjectDocument<U, TDocFields> });

  type HookOptions<
    TDocFields extends Deps | undefined = Deps,
    TFetchPrevious extends boolean = boolean,
  > = {
    docFields?: TDocFields;
    fetchPrevious?: TFetchPrevious;
  };

  type BeforeHookParams<U> = {
    doc: Partial<U>;
    previousDoc?: Partial<U>;
    userId?: string;
  };

  namespace Mongo {
    interface InsertOptions {
      skipHooks?: boolean;
    }

    interface UpdateOptions {
      skipHooks?: boolean;
    }

    interface UpsertOptions {
      skipHooks?: boolean;
    }

    interface RemoveOptions {
      skipHooks?: boolean;
    }

    interface Collection<T = any, U = T> {
      insertAsync(doc: m.Mongo.OptionalId<T>, options: InsertOptions): Promise<string>;
      updateAsync(
        selector: m.Mongo.Selector<T> | m.Mongo.ObjectID | string,
        modifier: NpmModuleMongodb.UpdateFilter<T>,
        options: UpdateOptions & {
          multi?: boolean;
          upsert?: boolean;
          arrayFilters?: { [identifier: string]: any }[];
        },
        callback?: Function,
      ): Promise<number>;
      upsertAsync(
        selector: m.Mongo.Selector<T> | m.Mongo.ObjectID | string,
        modifier: NpmModuleMongodb.UpdateFilter<T>,
        options: UpsertOptions & { multi?: boolean },
        callback?: Function,
      ): Promise<{
        numberAffected?: number;
        insertedId?: string;
      }>;
      removeAsync(
        selector: m.Mongo.Selector<T> | m.Mongo.ObjectID | string,
        options: RemoveOptions,
      ): Promise<number>;
      onInsert<const TDocFields extends Deps | undefined = undefined>(
        callback: (params: HookParams<U, TDocFields>) => void,
        options?: HookOptions<TDocFields>,
      ): HookRemoveFunction;
      onUpdate<
        const TDocFields extends Deps | undefined = undefined,
        const TFetchPrevious extends boolean = false,
      >(
        callback: (params: HookParams<U, TDocFields, TFetchPrevious>) => void,
        options?: HookOptions<TDocFields, TFetchPrevious>,
      ): HookRemoveFunction;
      onRemove<const TDocFields extends Deps | undefined = undefined>(
        callback: (params: HookParams<U, TDocFields>) => void,
        options?: HookOptions<TDocFields>,
      ): HookRemoveFunction;
      onBeforeInsert(callback: (params: BeforeHookParams<U>) => void): HookRemoveFunction;
      onBeforeUpdate(callback: (params: BeforeHookParams<U>) => void): HookRemoveFunction;
    }
  }
}
