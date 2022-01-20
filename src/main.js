// @ts-check

/**
 * @typedef {import('./types').RawStringTemplate} RawStringTemplate
 */

import {
  heap8,
  heap32, mem32,
  parse, next,
  readNumberOfValues,
  readFirstValuePointer,
  readKey,
  readProperty,
  readString
} from './parser.js';
import { Declaration, MultiDeclaration } from './declaration.js';
import { Rule } from './rule.js';
import { BindingSheet, SheetWithValues } from './sheet.js';
import { properties } from './property2.js';
import {
  AnyValue,
  BindValue,
  CustomFunctionValue,
  DataValue,
  GetValue,
  IndexValue,
  InsertionValue,
  ItemValue,
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
  ['data', DataValue],
  ['var', VarValue],
  ['get', GetValue],
  ['select', SelectValue],
  ['bind', BindValue],
  ['index', IndexValue],
  ['item', ItemValue]
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
 * 
 * @param {Value} keyValue 
 */
const expectKeyValueType = (keyValue) => {
  if(!((keyValue instanceof AnyValue) || (keyValue instanceof VarValue))) {
    throw new Error(`Unexpected key value type. Must be an identifier, a string, or a var`);    
  }
}

/**
 * Get the value type
 * @param {Number} ptr 
 * @returns {Number}
 */
function getValueType(ptr) {
  let ptr32 = ptr >> 2;  
  let valueType = mem32[ptr32];
  return valueType;
}

/**
 * Gets the value at the pointer location.
 * @param {Number} ptr 
 * @returns {Value}
 */
function getValue(ptr) {
  let ptrv32 = (ptr >> 2) + 3;
  
  let valueType = getValueType(ptr);
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
      /** @type {ValueType} */
      let ValueConstructor;
      /** @type {Value[]} */
      let args = [];
      if(fnMap.has(fn)) {
        ValueConstructor = fnMap.get(fn);
      } else if(fn.startsWith('--')) {
        ValueConstructor = CustomFunctionValue;
        args.push(new VarValue(new AnyValue(fn)));
      } else {
        throw new Error(`Unknown function ${fn}`);
      }

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
 * Read the key into a value
 * @returns {Value | null}
 */
function readKeyValue() {
  let key = readKey();
  switch(true) {
    case key.startsWith('--'): return new VarValue(key);
    case !!key: return new AnyValue(key);
    default: return null;
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
  let rule, ruleIndex = 0, declIndex = 0;
  parse(strings, values);
  while(next()) {
    switch(heap8[0]) {
      case 1: {
        declIndex = 0;
        rule = new Rule(readString(heap32[1], heap32[2]), ruleIndex++);
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
            rule.addDeclaration(new Declaration(rule, 'text', declIndex++, value));
            break;
          }
          case 'each': {
            expectValues(propName, 2);
            let ptr = readFirstValuePointer();
            let args = [];
            while(ptr) {
              args.push(getValue(ptr));
              ptr = mem32[(ptr >> 2) + 1];
            }
            rule.addDeclaration(new Declaration(rule, 'each-items', declIndex++, args[0]));
            rule.addDeclaration(new Declaration(rule, 'each-template', declIndex++, args[1]));
            break;
          }
          // case 'event':
          // case 'class-toggle':
          // case 'attr':
          // case 'attr-toggle':
          // case 'data':
          // case 'prop': {
          //   //expectMultipleOf(propName, 2); TODO needed some times?
          //   let key = readKey();
          //   let values = readNumberOfValues();
          //   let ptr = readFirstValuePointer();
          //   while(ptr) {
          //     /** @type {Value[] | Value[][]} */
          //     let args = [];
          //     /** @type {Value} */
          //     let keyValue;
          //     switch(true) {
          //       case key.startsWith('--'):
          //         keyValue = new VarValue(key);
          //         break;
          //       case !!key:
          //         keyValue = new AnyValue(key);
          //         break;
          //     }
          //     /** @type {Value[]} */
          //     let _args = keyValue ? /** @type {Value[]} */(args) : [];
          //     for(let i = 0; i < values; i++) {
          //       let vt = getValueType(ptr);
          //       switch(vt) {
          //         case 5: {
          //           /** @type {Value[][]} */(args).push(_args);
          //           _args = [];
          //           break;
          //         }
          //         default: {
          //           _args.push(getValue(ptr));
          //           break;
          //         }
          //       }

          //       ptr = mem32[(ptr >> 2) + 1];
          //     }
          //     let DCtr = Declaration;
          //     let index = declIndex;
          //     if(!keyValue && _args.length) {
          //       /** @type {Value[][]} */(args).push(_args);
          //       DCtr = MultiDeclaration;
          //       declIndex += args.length;
          //     }
          //     rule.addDeclaration(new DCtr(rule, propName, index, keyValue, ...args));
          //   }
          //   break;
          // }
          default: {
            let prop = readProperty();
            if(properties.has(prop)) {
              let desc = properties.get(prop);
              let ptr = readFirstValuePointer();
              let num = readNumberOfValues();
              if(desc.keyed) {
                let keyValue = readKeyValue();
                if(desc.hand === 'short') {
                  let declaration = new MultiDeclaration(rule, prop, declIndex++);
                  let cur = declaration;
                  let i = 0;
                  while(ptr) {
                    if(!keyValue) {
                      keyValue = getValue(ptr);
                      expectKeyValueType(keyValue);
                      ptr = mem32[(ptr >> 2) + 1];
                    }

                    if(getValueType(ptr) === 5) {
                      while(i < desc.explode.length) {
                        let eprop = desc.explode[i];
                        cur.add(new Declaration(rule, eprop, declIndex++, keyValue,
                          new AnyValue(properties.get(eprop).default)));
                        i++;
                      }
                      if(cur === declaration) {
                        let index = cur.index;
                        cur.index = declIndex++;
                        declaration = new MultiDeclaration(rule, prop, index);
                        declaration.add(cur);
                      }
                      cur = new MultiDeclaration(rule, prop, declIndex++, keyValue);
                      i = 0;
                      keyValue = null;
                    } else {
                      let value = getValue(ptr);
                      cur.add(new Declaration(rule, desc.explode[i], declIndex++, keyValue, value));
                      i++;
                    }

                    ptr = mem32[(ptr >> 2) + 1];
                  }
                  while(i < desc.explode.length) {
                    let eprop = desc.explode[i];
                    cur.add(new Declaration(rule, eprop, declIndex++, keyValue,
                      new AnyValue(properties.get(eprop).default)));
                    i++;
                  }
                  if(cur !== declaration)
                    declaration.add(cur);
                  rule.addDeclaration(declaration);
                } else {
                  let keyValue = readKeyValue();
                  if(!keyValue) {
                    throw new Error(`A key must be provided for the property ${prop}`);
                  }
                  if(num > 1) {
                    let m = new MultiDeclaration(rule, prop, declIndex++);
                    while(ptr) {
                      let value = getValue(ptr);
                      m.add(new Declaration(rule, prop, declIndex++, keyValue, value));
                      ptr = mem32[(ptr >> 2) + 1];
                    }
                    rule.addDeclaration(m);
                  } else {
                    rule.addDeclaration(
                      new Declaration(rule, prop, declIndex++, keyValue, getValue(ptr))
                    );
                  }
                }
              } else {
                throw new Error('Non-keyed not supported');
              }
            } else if(prop.startsWith('--')) {
              let values = readNumberOfValues();
              let ptr = readFirstValuePointer();
              /** @type {Value[]} */
              let args = [];
              while(values > 0) {
                let value = getValue(ptr);
                args.push(value);
                values--;
              }
              rule.addDeclaration(new Declaration(rule, prop, null, ...args));
            } else {
              let ptr = readFirstValuePointer();
              let args = [];
              while(ptr) {
                args.push(getValue(ptr));
                ptr = mem32[(ptr >> 2) + 1];
              }
              rule.addDeclaration(new Declaration(rule, prop, null, ...args));
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

export { mount } from './mount.js';