import {
  heap8, heap32, mem32,
  parse, next,
  readProperty,
  readString,
  readSelector,
  readValueType
} from './parser.js';
import {
  ClassTogglePart,
  EventPart,
  TextPart
} from './part.js';
import { Sheet, BindingResult } from './sheet.js';
import { InsertionValue } from './value.js';

const expectValues = num => {
  if(heap32[5] !== num) {
    throw new Error(`Expected ${num} values but found ${heap32[5]}`);
  }
}

function getValue(ptr) {
  let ptr32 = ptr >> 2;
  let ptrv32 = ptr32 + 3;
  
  switch(mem32[ptr32]) {
    case 1: {
      return new InsertionValue(mem32[ptrv32]);
    }
    case 2:
    case 3: {
      return readString(mem32[ptrv32], mem32[ptrv32 + 1]);
    }
  }
}

function addInsertion(sheet, Part, ptr) {
  let value = new InsertionValue(mem32[(ptr >> 2) + 3]);
  sheet.addPart(new Part(readSelector(), value));
}

function compile(strings, values) {
  let sheet = new Sheet();
  parse(strings, values);
  while(next()) {
    switch(heap32[0]) {
      case 2: {
        switch(readProperty()) {
          case 'text': {
            expectValues(1);
            let ptr = heap32[6];
            switch(readValueType(ptr)) {
              case 1: {
                addInsertion(sheet, TextPart, ptr);
                break;
              }
              default: {
                console.log('This type is not supported on text');
                break;
              }
            }
            break;
          }
          case 'event': {
            expectValues(2);
            let selector = readSelector();
            let values = heap32[5];
            let ptr = heap32[6];
            while(values > 0) {
              let evValue = getValue(ptr);
              let cbValue = getValue(mem32[(ptr >> 2) + 1]);
              sheet.addPart(new EventPart(selector, evValue, cbValue));
              values -= 2;
            }
            break;
          }
          case 'class-toggle': {
            expectValues(2);
            let selector = readSelector();
            let values = heap32[5];
            let ptr = heap32[6];
            while(values > 0) {
              let classNameValue = getValue(ptr);
              let condValue = getValue(mem32[(ptr >> 2) + 1]);
              sheet.addPart(new ClassTogglePart(selector, classNameValue, condValue));
              values -= 2;
            }
            break;
          }
          default: {
            throw new Error(`Unknown property: ${readProperty()}`);
          }
        }
        break;
      }
    }
  }
  return sheet;
}

const cache = new WeakMap();

function memoizeCompile(strings, values) {
  if(cache.has(strings)) {
    return cache.get(strings);
  }
  let sheet = compile(strings, values);
  let binding = new BindingResult(sheet, values);
  cache.set(strings, binding);
  return binding;
}

export default function(strings, ...values) {
  let binding = memoizeCompile(strings, values);
  binding.values = values;
  return binding;
}