const memory = new WebAssembly.Memory({initial:1});
let buffer = globalThis.MEMORY =new Uint8Array(memory.buffer);

const importObject = {
  js: { mem: memory }
};

const {instance: {exports}} = await WebAssembly.instantiateStreaming(
  fetch(new URL('./dsl.wasm', import.meta.url)),
  importObject
);

const $parse = exports.parse;

function writeToBuffer(value) {
  let enc = new TextEncoder();
  enc.encodeInto(value, buffer);
}

export function parse(source, ...values) {
  let holes = values.map(_ => 'hole');
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);
  let ret = $parse(raw.length);

  switch(buffer[ret]) {
    case 1: {
      let start = buffer[ret + 1];
      let end = buffer[ret + 2];
      let d = new TextDecoder();
      let selector = d.decode(buffer.slice(start, end));
      console.log(selector);
      break;
    }
  }
}

