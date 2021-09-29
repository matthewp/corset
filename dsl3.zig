
const ParseState = struct {
  state: i32,
  idx: i32
};



export fn parse(address: usize, array_length: i32) usize {
  var state: ParseState = undefined;

  if(address > 0) {
    var s: *ParseState = @intToPtr(*ParseState, address);
    state = s.*;
  } else {
    state = ParseState {
      .state = 0,
      .idx = array_length
    };
  }

  

  return @ptrToInt(&state);
}

//
//  (func $parse (param $idx_param i32) (param $array_length i32) (result i32)
//     ;; INTERNAL

//     ;; State of where we are
//     (local $state i32)

//     ;; declare the loop counter
//     (local $idx i32)
//     ;; The index we are in the source
//     (local $idx_bytes i32)

//     ;; The current char
//     (local $char i32)
//     ;; Place in memory where the last non whitespace character
//     (local $lastNonWhitespace i32)
    
//     (local.set $idx (local.get $idx_param))
//     (local.set $idx_bytes (i32.const 0))

//     ;; Load parse state from memory
//     (local.set $state (i32.load8_u (global.get $intmemstack_ptr)))

//     (block
//       (loop