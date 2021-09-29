import {
  mem32,
  mem8,
  tokenize as $tokenize
} from './tokenizer4.js';

const INSERTION = 'ins()';

const eMem8 = mem8.subarray(32768);
const eMem32 = mem32.subarray(32768 >> 2);

//const $callType = exports.callType;
//const $propertyType = exports.propertyType;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function writeToBuffer(value) {
  encoder.encodeInto(value, mem8);
}

function readFromBuffer(buffer, start, end) {
  return decoder.decode(buffer.slice(start, end));
}

function debugPrintArray(ret) {
  console.log(ret);
  let ret32 = ret >> 2;
  let arr = mem8.slice(ret, ret + 40);
  //arr = mem32.slice(ret32, ret32 + 20);
  console.table(arr);
}

export function debug(source, ...values) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);
  let limit = 15;

  let idx = 0;
  let len = raw.length;
  let ret;

  while(true) {
    ret = $tokenize(idx, len);
    let ret32 = ret >> 2;
    idx = mem32[ret32];

    let out = {
      byteIndex: idx,
      holeIndex: mem32[ret32 + 1],
      tag: mem8[ret + 8],
    };

    switch(out.tag) {
      case 0: {
        out.tagName = 'EOF';
        break;
      }
      case 1: {
        Object.assign(out, {
          tagName: 'RuleStart',
          selectorStart: mem32[ret32 + 2] >> 8,
          selectorEnd: mem32[ret32 + 3] >> 8,
          selector: readFromBuffer(mem8, mem32[ret32 + 2] >> 8, mem32[ret32 + 3] >> 8)
        });
        break;
      }
      case 2: {
        Object.assign(out, {
          tagName: 'Property',
          selectorStart: mem32[ret32 + 2] >> 8,
          selectorEnd: mem32[ret32 + 3] >> 8,
          selector: readFromBuffer(mem8, mem32[ret32 + 2] >> 8, mem32[ret32 + 3] >> 8),
          propertyStart: mem32[ret32 + 4] >> 8,
          propertyEnd: mem32[ret32 + 5] >> 8,
          property: readFromBuffer(mem8, mem32[ret32 + 4] >> 8, mem32[ret32 + 5] >> 8),
          valueType: mem8[ret + 25]
        });
        switch(out.valueType) {
          case 1:
            out.valueTypeName = 'Insertion';
            out.valueIndex = mem8[ret + 26];
            break;
          case 2:
            out.valueTypeName = 'String';
            break;
          case 3:
            out.valueTypeName = 'Identifier';
            out.identifierStart = mem32[ret32 + 7];
            out.identifierEnd = mem32[ret32 + 7] + 3; // TODO made up
            out.identifier = readFromBuffer(mem8, mem32[ret32 + 7], mem32[ret32 + 7] + 3);
            out.callType = $callType(out.identifierStart, out.identifierEnd);
            break;
          case 9:
            out.valueTypeName = 'Unknown';
            break;
        }
      }
    }

    //debugPrintArray(ret);
    console.table(out);

    if(out.tag === 0)
      break;
    else if(limit === 0)
      break;
    else
      limit--;
  }
}

export function tokenize(source, values, cb) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  let idx = 0;
  let len = raw.length;
  let ret;

  while(true) {
    ret = $tokenize(idx, len);
    idx = mem32[ret >> 2];
    if(mem8[ret + 8] === 0)
      break;

    cb(eMem8, eMem32);
  }
}

// Reading
export const readSelector = () => readFromBuffer(mem8, eMem32[2] >> 8, eMem32[3] >> 8);
export const readValueType = () => eMem8[25];
export const readPropertyType = () => $propertyType(eMem32[4] >> 8, eMem32[5] >> 8);

export const readInsertionValueIndex = () => eMem8[26];