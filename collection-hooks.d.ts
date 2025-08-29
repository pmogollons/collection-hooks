type HookRemoveFunction = () => void;

type Deps = {
  [field: string]: boolean | 1 | -1 | Deps
}

declare module "meteor/pmogollons:collection-hooks" {
  interface CollectionHooks {
    onError(callback: (error: Error) => void): HookRemoveFunction;
  }
}

declare module "meteor/mongo" {
  type HookParams<U> = {
    doc: Partial<U>;
    previousDoc?: Partial<U>;
    userId?: string;
  }

  type HookOptions = {
    docFields?: Deps;
    fetchPrevious?: boolean;
  }

  namespace Mongo {
    interface Collection<T = any, U = T> {
      onInsert(callback: (params: HookParams<U>) => void, options?: HookOptions): HookRemoveFunction;
      onUpdate(callback: (params: HookParams<U>) => void, options?: HookOptions): HookRemoveFunction;
      onRemove(callback: (params: HookParams<U>) => void, options?: HookOptions): HookRemoveFunction;
      onBeforeInsert(callback: (params: HookParams<U>) => void): HookRemoveFunction;
      onBeforeUpdate(callback: (params: HookParams<U>) => void): HookRemoveFunction;
    }
  }
}