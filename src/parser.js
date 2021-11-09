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

const tag_ptr = 66604;
const tag_ptr32 = tag_ptr >> 2;

export const heap8 = mem8.subarray(tag_ptr);
export const heap32 = mem32.subarray(tag_ptr32);

const enc = new TextEncoder();
const dec = new TextDecoder();

const writeToBuffer = value => enc.encodeInto(value, mem8);
const readFromBuffer = (buffer, start, end) => dec.decode(buffer.slice(start, end));

let len;
export function parse(source, values) {
  $reset();

  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  len = raw.length;
}

export const next = () => $parse(len);

// Reading
export const readString = (start, end) => {
  return readFromBuffer(mem8, start, end);
};
export const readProperty = () => readFromBuffer(mem8, heap32[1], heap32[2]);
export const readNumberOfValues = () => heap32[3];
export const readFirstValuePointer = () => heap32[4];