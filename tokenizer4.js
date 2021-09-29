export const mem8 = new Uint8Array(65_536);
export const mem32 = new Uint32Array(mem8.buffer);

const memstackptr = 32768 | 0;
const tagmemstackptr = 32776 | 0;
const intmemstackptr = 49152 | 0;

const identifierToken = t => (t >= 97 && t <= 122);
const selectorToken = t => identifierToken(t)
  || t === 35 // #
  || t === 46 // .
  ;
const innerSelectorToken = t => selectorToken(t)
  || t === 32; // Space

export function tokenize(idxparam, len) {
  let char;
  let lastNonWhitespace;
  let state = mem8[intmemstackptr];
  let idx = idxparam;

  while(1) {
    char = mem8[idx];

    switch(state) {
      // ResetState
      case 0:
        if(selectorToken(char)) {
          lastNonWhitespace = idx;
          state = 1;
          mem8[tagmemstackptr] = 1;
          mem8[tagmemstackptr + 1] = idx;
        }
        break;
      // RuleStart
      case 1:
        if(innerSelectorToken(char)) {
          lastNonWhitespace = idx;
        } else {
          if(char === 123) { // {
            // RuleReset
            mem8[intmemstackptr] = 2;
            state = 9;
            mem32[(tagmemstackptr >> 2) + 5] = lastNonWhitespace + 1;
          } else {
            // ERROR
          }
        }

        break;
    }

    idx++;

    if(idx === len) {
      mem8[tagmemstackptr] = 0;
      mem8[intmemstackptr] = 0;
      state = 9;
    }

    // Exit state
    if(state === 9)
      break;
  }

  mem32[memstackptr >> 2] = idx;
  return memstackptr;
}