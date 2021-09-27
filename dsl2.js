import {
  tokenize,
  readSelector,
  readPropertyType,
  readValueType
} from './parser2.js';
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
              // Identifier
              case 3: {
                let value = new InsertionValue(0);
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