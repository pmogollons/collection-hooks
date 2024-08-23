declare module "meteor/pmogollons:collection-hooks" {
  interface CollectionHooks {
    onError: (callback: (error: Error) => void) => void;
  }
}

declare module "meteor/mongo" {
  type AnyObject = Record<string, any>;

  type DependencyGraph = {
    [field: string]: DependencyGraph
  }

  type FilterParams = {
    filters: AnyObject;
    options: AnyObject;
    params: AnyObject;
  }

  type Body<T> = {
    [field: string]: DependencyGraph | Body<T>;
  }

  type HookParams = {
    doc: AnyObject;
    previousDoc?: Body<any>;
    userId?: string;
  }

  type HookOptions = {
    docFields?: AnyObject;
    fetchPrevious?: boolean;
  }

  namespace Mongo {
    interface Collection<T, U = T> {
      onInsert(callback: (params: HookParams) => void, options?: HookOptions): void;
      onUpdate(callback: (params: HookParams) => void, options?: HookOptions): void;
      onRemove(callback: (params: HookParams) => void, options?: HookOptions): void;
      onBeforeInsert(callback: (params: HookParams) => void): void;
    }
  }
}