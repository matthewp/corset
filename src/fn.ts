import type { Binding } from './binding';
import type { Changeset } from './changeset';
import type { RootElement } from './types';
import type { Store } from './store';

export interface FunctionContext {
  rootElement: RootElement;
  element: Element;
  createStore(): Store;
  __proto__: Binding;
}

export declare class ICorsetFunction {
  static inputProperties?: string[];
  call(args: any[], props: Map<string, any> | null, context: FunctionContext): any;
  check?(args: any[], props: Map<string, any> | null, context: FunctionContext, changeset: Changeset): boolean;
}

export type ICorsetFunctionClass = typeof ICorsetFunction;

export interface FunctionRegistry {
  fns: Map<string, ICorsetFunctionClass>;
}