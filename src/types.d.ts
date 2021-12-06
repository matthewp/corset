
export interface ValueType {
  new(...args: Value[]): Value;
}

export interface Value {
  get(rootElement: Element, element: Element, values?: any[]): any;
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