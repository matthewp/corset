const INSERTION = 'ins()';

const wasm = await WebAssembly.instantiateStreaming(
  fetch(new URL('./dsl-debug.wasm', import.meta.url)),
  {
    env: {
      printf
    }
  }
);

const {instance: {exports}} = wasm;

const $memory = exports.memory;
const $parse = exports.parse;
const $reset = exports.reset;
const $callType = exports.callType;
const $propertyType = exports.propertyType;

const buffer8 = new Uint8Array($memory.buffer);
const buffer32 = new Uint32Array($memory.buffer);

const eMem8 = buffer8.subarray(32768);
const eMem32 = buffer32.subarray(32768 >> 2);

const tag_ptr = 66596;
const tag_ptr32 = tag_ptr >> 2;

function printf(charPtr, ...args) {
  let ptrEnd = charPtr;
  let buffer = '', inIns = false, index = 0;
  while(buffer8[ptrEnd] !== 0) {
    let c = buffer8[ptrEnd];
    if(c === 37)
      inIns = true;
    else if(inIns) {
      inIns = false;
      let value = buffer8[args[index++]];
      switch(c) {
        case 99: {
          buffer += String.fromCharCode(value);
          break;
        }
        default: {
          buffer += value;
          break;
        }
      }
    } else {
      buffer += String.fromCharCode(c);
    }

    ptrEnd++;
  }
  console.log(buffer);
}

function writeToBuffer(value) {
  let enc = new TextEncoder();
  enc.encodeInto(value, buffer8);
}

function readFromBuffer(buffer, start, end) {
  let d = new TextDecoder();
  return d.decode(buffer.slice(start, end));
}

export function hash(str) {
  writeToBuffer(str);
  let hash = exports.hash(0, str.length);
  return hash;
}

export function debug(source, ...values) {
  $reset();

  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  let limit = 15;
  let len = raw.length;

  while(true) {
    if(!$parse(len)) {
      break;
    }

    let out = {
      parserMode: buffer32[66578 >> 2],
      tag: buffer32[tag_ptr32]
    };

    switch(out.tag) {
      case 0: {
        out.tagName = 'EOF';
        break;
      }
      case 1: {
        Object.assign(out, {
          tagName: 'RuleStart',
          selectorStart: buffer32[tag_ptr32 + 1],
          selectorEnd: buffer32[tag_ptr32 + 2],
          selector: readFromBuffer(buffer8, buffer32[tag_ptr32 + 1], buffer32[tag_ptr32 + 2])
        });
        break;
      }
      case 2: {
        let selector_list = buffer32[tag_ptr32 + 2] >> 2;
        Object.assign(out, {
          tagName: 'Property',
          numberOfSelectors: buffer32[tag_ptr32 + 1],
          selectorStart: buffer32[selector_list],
          selectorEnd: buffer32[selector_list + 1],
          selector: readSelector(),
          propertyStart: buffer32[tag_ptr32 + 3],
          propertyEnd: buffer32[tag_ptr32 + 4],
          property: readFromBuffer(buffer8, buffer32[tag_ptr32 + 3], buffer32[tag_ptr32 + 4]),
          numberOfValues: buffer32[tag_ptr32 + 5]
        });
        let nextValuePtr = buffer32[tag_ptr32 + 6];
        for(let i = 0; i < out.numberOfValues; i++) {
          let valuePtr = nextValuePtr;
          let valueType = buffer32[valuePtr >> 2];
          nextValuePtr = buffer32[(valuePtr >> 2) + 1];
          out[`value[${i}].type`] = valueType;
          let valueInfoPtr32 = (valuePtr >> 2) + 3;
          switch(valueType) {
            case 1: {
              out[`value[${i}].typeName`] = 'Insertion';
              out[`value[${i}].index`] = buffer32[valueInfoPtr32];
              break;
            }
            case 3: {
              out[`value[${i}].typeName`] = 'Identifier';
              out[`value[${i}].start`] = buffer32[valueInfoPtr32];
              out[`value[${i}].end`] = buffer32[valueInfoPtr32 + 1];
              out[`value[${i}].identifier`] = readFromBuffer(buffer8, buffer32[valueInfoPtr32], buffer32[valueInfoPtr32 + 1]);
            }
          }
        }
        switch(out.valueType) {
          case 1:
            out.valueTypeName = 'Insertion';
            out.valueIndex = buffer8[ret + 26];
            break;
          case 2:
            out.valueTypeName = 'String';
            break;
          case 3:
            out.valueTypeName = 'Identifier';
            out.identifierStart = buffer32[ret32 + 7];
            out.identifierEnd = buffer32[ret32 + 8];
            out.identifier = readFromBuffer(buffer8, out.identifierStart, out.identifierEnd);
            out.callType = $callType(out.identifierStart, out.identifierEnd);
            break;
          case 4:
              console.log(buffer8.subarray(ret))
              out.valueTypeName = 'Multi';
              break;
          case 9:
            out.valueTypeName = 'Unknown';
            break;
        }
        break;
      }
      // Error
      case 4: {
        Object.assign(out, {
          tagName: 'Error',
          code: buffer32[tag_ptr32 + 1],
          data: buffer8[tag_ptr + 8],
          extra: readFromBuffer(buffer8, 46, 49)
        });
        break;
      }
    }

    //debugPrintArray(ret);
    console.table(out);

    if(out.tag === 0 || out.tag === 4)
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
    ret = $parse(idx, len);
    idx = buffer32[ret >> 2];
    if(buffer8[ret + 8] === 0)
      break;

    cb(eMem8, eMem32);
  }
}

// Reading
export const readSelector = () => {
  let list_ptr = buffer32[tag_ptr32 + 2] >> 2;
  return readFromBuffer(buffer8, buffer32[list_ptr], buffer32[list_ptr + 1]);
};
export const readValueType = (ptr) => heap32[ptr];
export const readPropertyType = () => $propertyType(eMem32[4] >> 8, eMem32[5] >> 8);

export const readInsertionValueIndex = () => eMem8[26];