
export interface ValueType {
  new(...args: Value[]): Value;
}

export interface Value {
  get(element?: Element, values?: any[]): any;
}