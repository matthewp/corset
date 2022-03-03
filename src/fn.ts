import type { Changeset } from './changeset';
import type { RootElement } from './types';

export interface FunctionContext {
  rootElement: RootElement;
  element: Element;
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