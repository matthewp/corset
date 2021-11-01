const INSERTION = 'ins()';

const wasm = await WebAssembly.instantiateStreaming(
  fetch(new URL('./dsl-debug.wasm', import.meta.url))
);

const {instance: {exports}} = wasm;

const $memory = exports.memory;
const $parse = exports.parse;
const $reset = exports.reset;

const mem8 = new Uint8Array($memory.buffer);
export const mem32 = new Uint32Array($memory.buffer);

const tag_ptr = 66596;
const tag_ptr32 = tag_ptr >> 2;

export const heap8 = mem8.subarray(tag_ptr);
export const heap32 = mem32.subarray(tag_ptr32);


function writeToBuffer(value) {
  let enc = new TextEncoder();
  enc.encodeInto(value, mem8);
}

function readFromBuffer(buffer, start, end) {
  let d = new TextDecoder();
  return d.decode(buffer.slice(start, end));
}

let len;

export function parse(source, values) {
  $reset();

  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  len = raw.length;
}

export function next() {
  return $parse(len);
}

// Reading
export const readString = (start, end) => {
  return readFromBuffer(mem8, start, end);
};
export const readSelector = () => {
  let list_ptr = mem32[tag_ptr32 + 2] >> 2;
  return readFromBuffer(mem8, mem32[list_ptr], mem32[list_ptr + 1]);
};
export const readProperty = () => readFromBuffer(mem8, heap32[3], heap32[4]);
export const readValueType = ptr => mem32[ptr >> 2];