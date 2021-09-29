import {
  tokenize,
  readSelector,
  readPropertyType,
  readValueType,
  readInsertionValueIndex
} from './parser4.js';
import {
  TextPart
} from './part.js';
import { Sheet, BindingResult } from './sheet.js';
import { InsertionValue } from './value.js';

function compile(strings, values) {
  let sheet = new Sheet();
  tokenize(strings, values, (mem8, _mem32) => {
    switch(mem8[8]) {
      // Property
      case 2: {
        switch(readPropertyType()) {
          // Text
          case 1: {
            switch(readValueType()) {
              // Insertion
              case 1: {
                let value = new InsertionValue(readInsertionValueIndex());
                sheet.addPart(new TextPart(readSelector(), value))
                break;
              }
            }
            break;
          }
        }
        
        break;
      }
    }
  });
  return sheet;
}

export default function(strings, ...values) {
  return new BindingResult(compile(strings, values), values);
}