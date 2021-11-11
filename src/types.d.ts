
export interface ValueType {
  new(...args: Value[]): Value;
}

export interface Value {
  get(rootElement: Element, element: Element, values?: any[]): any;
}