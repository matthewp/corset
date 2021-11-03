// @ts-check
/// <reference path="./dsl.d.ts" />

import {
  heap32, mem32,
  parse, next,
  readNumberOfValues,
  readFirstValuePointer,
  readProperty,
  readString
} from './parser.js';
import { Declaration } from './declaration.js';
import {
  ClassToggleProperty,
  CustomProperty,
  EventProperty,
  TextProperty
} from './property.js';
import { Rule } from './rule.js';
import { BindingSheet, SheetWithValues } from './sheet.js';
import { AnyValue, InsertionValue, VarValue } from './value.js';

/** @typedef {import('./value').Value} Value */

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
      switch(fn) {
        case 'var': {
          return new VarValue(readString(mem32[ptrv32 + 2], mem32[ptrv32 + 3]));
        }
        default: {
          throw new Error(`Unknown function ${fn}`);
        }
      }
    }
    default: {
      throw new Error(`Unknown value type [${valueType}]`);
    }
  }
}

function compile(strings, values) {
  let sheet = new BindingSheet();
  let rule;
  parse(strings, values);
  loop: while(next()) {
    switch(heap32[0]) {
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
            rule.addDeclaration(new Declaration(rule, TextProperty, value));
            break;
          }
          case 'event': {
            expectValues(propName, 2);
            let values = readNumberOfValues();
            let ptr = readFirstValuePointer();
            while(values > 0) {
              let evValue = getValue(ptr);
              let cbValue = getValue(mem32[(ptr >> 2) + 1]);
              rule.addDeclaration(new Declaration(rule, EventProperty, evValue, cbValue));
              values -= 2;
            }
            break;
          }
          case 'class-toggle': {
            expectValues(propName, 2);
            let values = readNumberOfValues();
            let ptr = readFirstValuePointer();
            while(values > 0) {
              let classNameValue = getValue(ptr);
              let condValue = getValue(mem32[(ptr >> 2) + 1]);
              rule.addDeclaration(new Declaration(rule, ClassToggleProperty, classNameValue, condValue));
              values -= 2;
            }
            break;
          }
          default: {
            let prop = readProperty();
            if(prop.startsWith('--')) {
              let values = readNumberOfValues();
              let ptr = readFirstValuePointer();
              /** @type {Value[]} */
              let args = [new AnyValue(prop)];
              while(values > 0) {
                let value = getValue(ptr);
                args.push(value);
                values--;
              }
              rule.addDeclaration(new Declaration(rule, CustomProperty, ...args));
            } else {
              throw new Error(`Unknown property: ${prop}`);
            }
          }
        }
        break;
      }
      case 4: {
        console.log("GOT AN ERROR")
        break loop;
      }
    }
  }
  return sheet;
}

const cache = new WeakMap();

/**
 * 
 * @param {String[]} strings 
 * @param {any[]} values 
 * @returns 
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
 * @param {String[]} strings 
 * @param  {...any} values 
 * @returns 
 */
export default function(strings, ...values) {
  let sheet = memoizeCompile(strings, values);
  sheet.values = values;
  return sheet;
}