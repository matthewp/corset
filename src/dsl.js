// @ts-check

/**
 * @typedef {import('./types').RawStringTemplate} RawStringTemplate
 */

import {
  heap8, mem8,// TODO remove this
  heap32, mem32,
  parse, next,
  readNumberOfValues,
  readFirstValuePointer,
  readProperty,
  readString
} from './parser.js';
import { Declaration } from './declaration.js';
import { Rule } from './rule.js';
import { BindingSheet, SheetWithValues } from './sheet.js';
import {
  AnyValue,
  BindValue,
  GetValue,
  InsertionValue,
  SelectValue,
  VarValue
} from './value.js';

/**
 * @typedef {import('./types').ValueType} ValueType
 * @typedef {import('./types').Value} Value
 */
/**  */

/** @type {Map<string, ValueType>} */
// @ts-ignore -- Not sure why this is not working
const fnMap = new Map([
  ['var', VarValue],
  ['get', GetValue],
  ['select', SelectValue],
  ['bind', BindValue]
]);

/**
 * Asserts a number of values for a property.
 * @param {String} name The name of the property
 * @param {Number} num The number of expected values
 */
const expectValues = (name, num) => {
  if(readNumberOfValues() !== num) {
    throw new Error(`The property [${name}] expects ${num} values but found ${readNumberOfValues()}.`);
  }
}

const expectMultipleOf = (name, num) => {
  if(readNumberOfValues() % num !== 0) {
    throw new Error(`The property [${name}] expects a multiple of ${num} values but found ${readNumberOfValues()}.`);
  }
}

/**
 * Gets the value at the pointer location.
 * @param {Number} ptr 
 * @returns {Value}
 */
function getValue(ptr) {
  let ptr32 = ptr >> 2;
  let ptrv32 = ptr32 + 3;
  
  let valueType = mem32[ptr32];
  switch(valueType) {
    case 1: {
      return new InsertionValue(mem32[ptrv32]);
    }
    case 2:
    case 3: {
      return new AnyValue(readString(mem32[ptrv32], mem32[ptrv32 + 1]));
    }
    case 4: {
      let fn = readString(mem32[ptrv32], mem32[ptrv32 + 1]);
      if(!fnMap.has(fn)) {
        throw new Error(`Unknown function ${fn}`);
      }
      /** @type {ValueType} */
      let ValueConstructor = fnMap.get(fn);

      /** @type {Value[]} */
      let args = [];
      let vptr = mem32[ptrv32 + 3];
      while(vptr) {
        args.push(getValue(vptr));
        vptr = mem32[(vptr >> 2) + 1];
      }

      return new ValueConstructor(...args);
    }
    default: {
      throw new Error(`Unknown value type [${valueType}]`);
    }
  }
}

/**
 * 
 * @param {RawStringTemplate} strings 
 * @param {any[]} values 
 * @returns 
 */
function compile(strings, values) {
  let sheet = new BindingSheet();
  let rule;
  parse(strings, values);
  while(next()) {
    switch(heap8[0]) {
      case 1: {
        rule = new Rule(readString(heap32[1], heap32[2]));
        sheet.addRule(rule);
        break;
      }
      case 2: {
        let propName = readProperty();
        switch(propName) {
          case 'text': {
            expectValues(propName, 1);
            let ptr = readFirstValuePointer();
            let value = getValue(ptr);
            rule.addDeclaration(new Declaration(rule, 'text', value));
            break;
          }
          case 'each': {
            expectValues(propName, 3);
            let ptr = readFirstValuePointer();
            let args = [];
            while(ptr) {
              args.push(getValue(ptr));
              ptr = mem32[(ptr >> 2) + 1];
            }
            rule.addDeclaration(new Declaration(rule, 'each-items', args[0]));
            rule.addDeclaration(new Declaration(rule, 'each-template', args[1]));
            rule.addDeclaration(new Declaration(rule, 'each-scope', args[2]));
            break;
          }
          case 'event':
          case 'class-toggle':
          case 'attr':
          case 'attr-toggle':
          case 'data':
          case 'prop': {
            expectMultipleOf(propName, 2);
            let ptr = readFirstValuePointer();
            while(ptr) {
              let args = [];
              for(let i = 0; i < 2; i++) {
                args.push(getValue(ptr));
                ptr = mem32[(ptr >> 2) + 1];
              }

              rule.addDeclaration(new Declaration(rule, propName, ...args));
            }
            break;
          }
          default: {
            let prop = readProperty();
            if(prop.startsWith('--')) {
              let values = readNumberOfValues();
              let ptr = readFirstValuePointer();
              /** @type {Value[]} */
              let args = [];
              while(values > 0) {
                let value = getValue(ptr);
                args.push(value);
                values--;
              }
              rule.addDeclaration(new Declaration(rule, prop, ...args));
            } else {
              let ptr = readFirstValuePointer();
              let args = [];
              while(ptr) {
                args.push(getValue(ptr));
                ptr = mem32[(ptr >> 2) + 1];
              }
              rule.addDeclaration(new Declaration(rule, prop, ...args));
            }
          }
        }
        break;
      }
      // TODO remove in build
      case 4: {
        let code = heap32[1];
        switch(code) {
          case 1:
          case 2: {
            let charCode = heap32[2];
            switch(charCode) {
              // '
              case 39: {
                throw new SyntaxError("Saw the a single quote character ('). Use double quotes (\") for strings.")
                break;
              }
              default: {
                throw new SyntaxError(`Unexpected token "${String.fromCharCode(charCode)}" found. Error code ${code}.`);
              }
            }
            
          }
          default: {
            throw new Error(`Unknown Parse error occurred. Error code [${code}]`);
          }
        }
      }
    }
  }
  return sheet;
}

const cache = new WeakMap();

/**
 * 
 * @param {RawStringTemplate} strings 
 * @param {any[]} values 
 * @returns {SheetWithValues}
 */
function memoizeCompile(strings, values) {
  if(cache.has(strings)) {
    return cache.get(strings);
  }
  let bindingSheet = compile(strings, values);
  let sheet = new SheetWithValues(bindingSheet, values);
  cache.set(strings, sheet);
  return sheet;
}

/**
 * The main DSL
 * @param {RawStringTemplate} strings 
 * @param  {...any} values 
 * @returns {SheetWithValues}
 */
export default function(strings, ...values) {
  let sheet = memoizeCompile(strings, values);
  sheet.values = values;
  return sheet;
}