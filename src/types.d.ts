import type { Binding } from './binding.js';

export interface ValueType {
  new(...args: Value[]): Value;
}

export interface Value {
  get(Binding?: binding, values?: any[]): any;
}