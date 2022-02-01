import type { Binding } from './bindings';
import type { Changeset } from './changeset';

export interface ValueType {
  static inputProperties?: string[];
  new(...args: Value[]): Value;
}

interface BaseValue {
  get(args: any[], binding: Binding, props: Map<string, any> | null, changeset: Changeset): any;
}

export interface VersionedValue extends BaseValue {
  version: (args: any[], binding: Binding, props: Map<string, any> | null, changeset: Changeset) => number;
}

export interface CheckedValue extends BaseValue {
  check(args: any[], binding: Binding, props: Map<string, any> | null, changeset: Changeset): boolean;
}

export interface Value extends BaseValue {
  version?: VersionedValue['version'];
  check?: CheckedValue['check'];
}

export interface WasmParser extends WebAssembly.Exports {
  get_tag(): number;
  memory: {
    buffer: ArrayBuffer;
  };
  parse(n: number): 1 | 0;
  reset(n: number): number;
}

export type RawStringTemplate = { raw: readonly string[] | ArrayLike<string>};