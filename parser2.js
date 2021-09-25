const INSERTION = 'ins';
const memory = new WebAssembly.Memory({ initial: 1 });
const buffer8 = new Uint8Array(memory.buffer);
const buffer32 = new Uint32Array(memory.buffer);

const importObject = {
  env: { mem: memory }
};

const {instance: {exports}} = await WebAssembly.instantiateStreaming(
  fetch(new URL('./dsl.wasm', import.meta.url)),
  importObject
);

const $parse = exports.parse;

function writeToBuffer(value) {
  let enc = new TextEncoder();
  enc.encodeInto(value, buffer8);
}

function readFromBuffer(buffer, start, end) {
  let d = new TextDecoder();
  return d.decode(buffer.slice(start, end));
}

function debugPrintArray(ret) {
  console.log(ret);
  let ret32 = ret >> 2;
  let arr = buffer8.slice(ret, ret + 40);
  //arr = buffer32.slice(ret32, ret32 + 20);
  console.table(arr);
}

export function hash(str) {
  writeToBuffer(str);
  let hash = exports.hash(0, str.length);
  return hash;
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
    ret = $parse(idx, len);
    let ret32 = ret >> 2;
    idx = buffer32[ret32];

    let out = {
      byteIndex: idx,
      holeIndex: buffer32[ret32 + 1],
      tag: buffer8[ret + 8],
    };

    switch(out.tag) {
      case 0: {
        out.tagName = 'EOF';
        break;
      }
      case 1: {
        Object.assign(out, {
          tagName: 'RuleStart',
          selectorStart: buffer32[ret32 + 2] >> 8,
          selectorEnd: buffer32[ret32 + 3] >> 8,
          selector: readFromBuffer(buffer8, buffer32[ret32 + 2] >> 8, buffer32[ret32 + 3] >> 8)
        });
        break;
      }
      case 2: {
        Object.assign(out, {
          tagName: 'Property',
          selectorStart: buffer32[ret32 + 2] >> 8,
          selectorEnd: buffer32[ret32 + 3] >> 8,
          selector: readFromBuffer(buffer8, buffer32[ret32 + 2] >> 8, buffer32[ret32 + 3] >> 8),
          propertyStart: buffer32[ret32 + 4] >> 8,
          propertyEnd: buffer32[ret32 + 5] >> 8,
          property: readFromBuffer(buffer8, buffer32[ret32 + 4] >> 8, buffer32[ret32 + 5] >> 8),
          valueType: buffer8[ret + 25]
        });
        switch(out.valueType) {
          case 2:
            out.valueType = 'String';
            break;
          case 3:
            out.valueType = 'Identifier';
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

export function parse(source, ...values) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  let idx = 0;
  let ret = $parse(idx, raw.length);

  switch(buffer[ret + 2]) {
    case 1: {
      let start = buffer[ret + 3];
      let end = buffer[ret + 4];
      let d = new TextDecoder();
      let selector = d.decode(buffer8.slice(start, end));
      console.log(selector);
      break;
    }
  }
}