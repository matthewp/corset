import type { Changeset } from './changeset';

export interface FunctionContext {
  rootElement: Element;
  element: Element;
}

export interface ICorsetFunction {
  call(args: any[], props: Map<string, any> | null, c: FunctionContext): any;
  check?(args: any[], props: Map<string, any> | null, c: FunctionContext, cs: Changeset): boolean;
}

export interface ICorsetFunctionClass {
  static inputProperties?: string[];
  new(): ICorsetFunction;
}

export interface FunctionRegistry {
  fns: Map<string, ICorsetFunctionClass>;
}

export declare const registry: FunctionRegistry;
export declare const localsRegistry: FunctionRegistry;

export declare function registerCustomFunction(this: FunctionRegistry | void, name: string, ctr: ICorsetFunctionClass): void;
export declare function createLocalsScopeFunction(name: string): ICorsetFunctionClass;