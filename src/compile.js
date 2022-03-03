// @ts-check

/**
 * @typedef {import('./parser').RawStringTemplate} RawStringTemplate
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
import { Declaration } from './declaration.js';
import { Rule } from './rule.js';
import { BindingSheet, SheetWithValues } from './sheet.js';
import {
  anyValue,
  CommaSeparatedListValue,
  functionValue,
  InsertionValue,
  PlaceholderValue,
  SpaceSeparatedListValue,
} from './value.js';
import {
  registry as fnRegistry,
  localsRegistry as fnLocalsRegistry,
  createLocalsScopeFunction
} from './function.js';
import { properties, features } from './property.js';
import { createValueTemplate } from './template.js';

/**
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./types').ValueType} ValueType
 * @typedef {import('./types').Value} Value
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./function').ICorsetFunctionClass} ICorsetFunctionClass
 */

/**
 * 
 * @param {string} key
 * @returns {ValueTemplate}
 */
function getKeyValue(key) {
  let template = key.startsWith('--') ?
    createValueTemplate(PlaceholderValue, [
      createValueTemplate(anyValue(key))
    ]) :
    createValueTemplate(anyValue(key));
  return template;
}

/**
 * Gets the value at the pointer location.
 * @param {Number} ptr
 * @returns {ValueTemplate}
 */
function getValue(ptr) {
  let ptr32 = ptr >> 2;
  let ptrv32 = ptr32 + 3;
  
  let valueType = mem32[ptr32];
  switch(valueType) {
    case 1: {
      return createValueTemplate(InsertionValue, [
        createValueTemplate(anyValue(mem32[ptrv32]))
      ]);
    }
    case 2:
    case 3: {
      return createValueTemplate(
        anyValue(readString(mem32[ptrv32], mem32[ptrv32 + 1]))
      );
    }
    case 4: {
      let fnName = readString(mem32[ptrv32], mem32[ptrv32 + 1]);
      /** @type {ValueType} */
      let Value;
      switch(true) {
        case fnName === 'var': Value = PlaceholderValue; break;
        case fnRegistry.fns.has(fnName): {
          let CorsetFunction = /** @type {ICorsetFunctionClass} */(fnRegistry.fns.get(fnName));
          Value = functionValue(CorsetFunction);
          break;
        }
        case fnLocalsRegistry.fns.has(fnName): {
          let CorsetFunction = /** @type {ICorsetFunctionClass} */(fnLocalsRegistry.fns.get(fnName));
          Value = functionValue(CorsetFunction);
          break;
        }
        case fnName.startsWith('--'): {
          let CorsetFunction = createLocalsScopeFunction(fnName);
          Value = functionValue(CorsetFunction);
          break;
        }
        default: throw new Error(`Unknown function ${fnName}`);
      }

      let args = [];
      let vptr = mem32[ptrv32 + 3];
      while(vptr) {
        args.push(getValue(vptr));
        vptr = mem32[(vptr >> 2) + 1];
      }

      return createValueTemplate(Value, args);
    }
    case 6: {
      return createValueTemplate(anyValue(Boolean(mem32[ptrv32])));
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
  let sourceOrder = 0;
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

        let ptr = readFirstValuePointer();
        let num = readNumberOfValues();

        // TODO only if this property is keyed
        let key = readKey();

        /** @type {PropertyDefinition} */
        let defn = properties[propName];

        /** @type {ValueTemplate[]} */
        let args = [], _args = args;
        while(ptr) {
          let valueType = mem32[ptr >> 2];
          switch(valueType) {
            case 5: {
              if(args === _args) {
                args = [];
              }
              args.push(createValueTemplate(SpaceSeparatedListValue, _args));
              _args = [];
              break;
            }
            default: {
              _args.push(getValue(ptr));
              break;
            }
          }
          ptr = mem32[(ptr >> 2) + 1];
        }
        let commaSeparated = args !== _args;
        // Multis are coerced to comma separated even if they had no commas.
        // Ideally this would happen in the parser.
        if(defn?.feat & features.multi && !commaSeparated && !key) {
          args = [];
        }
        if(commaSeparated || ((defn?.feat & features.multi) && !key)) {
          args.push(createValueTemplate(SpaceSeparatedListValue, _args));
        }

        let declaration = new Declaration(/** @type {Rule} */(rule), propName, sourceOrder++);
        switch(true) {
          case !!(defn?.feat & features.multi): {
            declaration.template = createValueTemplate(CommaSeparatedListValue, args);
            break;
          }
          case !!((defn?.feat & features.keyed) && (defn?.feat & features.longhand)) && !key: {
            throw new Error(`[${propName}] requires a key.`);
          }
          case !!(defn?.feat & features.longhand) || num > 1: {
            let Value = commaSeparated ? CommaSeparatedListValue : SpaceSeparatedListValue;
            declaration.template = createValueTemplate(Value, args);
            break;
          }
          default: {
            declaration.template = args[0];
            break;
          }
        }

        if(key) {
          declaration.key = key;
          declaration.keyTemplate = getKeyValue(key);
        }

        declaration.init();
        /** @type {Rule} */(rule).addDeclaration(declaration);

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
export function sheet(strings, ...values) {
  let sheet = memoizeCompile(strings, values);
  sheet.values = values;
  return sheet;
}