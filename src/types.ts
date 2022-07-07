import type { Binding } from './binding';
import type { Changeset } from './changeset';
import type { BehaviorContext } from './mount';
import type { SheetWithValues } from './sheet';

type DeclaredInputProperties = string[];

export interface ValueType {
  inputProperties?: DeclaredInputProperties;
  new(binding: Binding): Value;
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
  parse(n: number): 1 | 0;
  reset(n: number): number;
}

export type RawStringTemplate = { raw: readonly string[] | ArrayLike<string>};

type InputProperties = Map<string, any>;

export declare class MountedBehavior {
  static inputProperties?: DeclaredInputProperties;
  constructor(props: InputProperties | null, ctx: BehaviorContext);
  bind(props: InputProperties | null, ctx: BehaviorContext): SheetWithValues;
}

export type MountedBehaviorType = typeof MountedBehavior;

export type HostElement = Element | Document | ShadowRoot;
export type RootElement = Element | Document | ShadowRoot;