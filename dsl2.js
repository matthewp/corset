import {
  tokenize,
  readSelector,
  readPropertyType,
  readValueType
} from './parser2.js';
import {
  TextPart
} from './part.js';
import { Template, TemplateResult } from './template.js';

function compile(strings, values) {
  const parts = [];
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
                
                
                parts.push(new TextPart(readSelector(), value));
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
  return new Template(parts);
}

export default function(strings, ...values) {
  return new TemplateResult(compile(strings, values), values);
}