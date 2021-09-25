;; https://learnxinyminutes.com/docs/wasm/
;; https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format

(module
  (import "env" "mem" (memory 1))

  (global $memstack_ptr (mut i32) (i32.const 32768))
  (global $tagmemstack_ptr (mut i32) (i32.const 32776))
  (global $intmemstack_ptr (mut i32) (i32.const 49152))

  (global $tag_rule_start i32 (i32.const 1))
  (global $tag_end i32 (i32.const 9))

  (func $add (param $lhs i32) (param $rhs i32) (result i32)
    local.get $lhs
    local.get $rhs
    i32.add)
  (export "add" (func $add))

  (func $between (param $a i32) (param $b i32) (param $c i32) (result i32)
    (local $ret i32)
    (if (i32.ge_u (local.get $a) (local.get $b))
      (then
        (if (i32.le_u (local.get $a) (local.get $c))
          (then (local.set $ret (i32.const 1)))
          (else (local.set $ret (i32.const 0)))
        )
      )
      (else (local.set $ret (i32.const 0)))
    )
    (local.get $ret)
  )

  (func $hash (param $start i32) (param $end i32) (result i64)
    (local $hash i64)

    ;; declare the loop counter
    (local $idx i32)
    (local $char i64)

    (local.set $hash (i64.const 5381))
    (local.set $idx (local.get $start))

    (block
      (loop
        (br_if 1 (i32.eq (local.get $idx) (local.get $end)))

        ;; get the value of the array from memory:
        (local.set $char (i64.load8_u (local.get $idx)))

        (local.set $hash
          (i64.add
            (i64.add
              (i64.shl (local.get $hash) (i64.const 5))
              (local.get $hash)
            )
            (local.get $char)
          )
        )

        ;; increment the loop counter
        (local.set $idx (i32.add (local.get $idx) (i32.const 1)))
        (br 0)
      )
    )

    (local.get $hash)
  )
  (export "hash" (func $hash))

  (func $identifierToken (param $t i32) (result i32)
    (local $val i32)
    (local.set $val (i32.const 1)) ;; default to true
    (block $b1
      (br_if $b1 (call $between (local.get $t) (i32.const 97) (i32.const 122))) ;; a-z
      (local.set $val (i32.const 0)) ;; fallback to false
    )
    (local.get $val)
  )

  (func $selectorToken (param $t i32) (result i32)
    (local $val i32)
    (local.set $val (i32.const 1))
    (block $b0
      (br_if $b0 (call $identifierToken (local.get $t)))
      (br_if $b0 (i32.eq (local.get $t) (i32.const 35))) ;; #
      (br_if $b0 (i32.eq (local.get $t) (i32.const 46))) ;; .
      (local.set $val (i32.const 0))
    )
    (local.get $val)
  )

  (func $whitespaceToken (param $t i32) (result i32)
    (local $val i32)
    (local.set $val (i32.const 1))
    (block $b0
      (br_if $b0 (i32.eq (local.get $t) (i32.const 32))) ;; Space
      (br_if $b0 (call $between (local.get $t) (i32.const 10) (i32.const 13))) ;; tabs, newlines, etc.
      (local.set $val (i32.const 0))
    )
    (local.get $val)
  )

  (func $parse (param $idx_param i32) (param $array_length i32) (result i32)
    ;; INTERNAL

    ;; State of where we are
    (local $state i32)

    ;; declare the loop counter
    (local $idx i32)
    ;; The index we are in the source
    (local $idx_bytes i32)

    ;; The current char
    (local $char i32)
    ;; Place in memory where the last non whitespace character
    (local $lastNonWhitespace i32)
    
    (local.set $idx (local.get $idx_param))
    (local.set $idx_bytes (i32.const 0))

    ;; Load parse state from memory
    (local.set $state (i32.load8_u (global.get $intmemstack_ptr)))

    (block
      (loop
        ;; this sets idx_bytes to bytes offset of the value we're interested in.
        (local.set $idx_bytes (i32.mul (local.get $idx) (i32.const 1)))

        ;; get the value of the array from memory:
        (local.set $char (i32.load8_u (local.get $idx_bytes)))

        ;; Reset state
        (if (i32.eq (local.get $state) (i32.const 0))
          (then
            (if (call $selectorToken (local.get $char))
              (then
                (local.set $lastNonWhitespace (local.get $idx_bytes))
                (local.set $state (i32.const 1))

                ;; Tag
                (i32.store8
                  (global.get $tagmemstack_ptr)
                  (i32.const 1) ;; RuleStart
                )

                ;; selectorStart
                (i32.store offset=1
                  (global.get $tagmemstack_ptr)
                  (local.get $idx_bytes)
                )
              )
            )
          )
          (else
            ;; RuleStart
            (if (i32.eq (local.get $state) (i32.const 1))
              (then
                (if (call $selectorToken (local.get $char))
                  (then
                    (local.set $lastNonWhitespace (local.get $idx_bytes))
                  )
                  (else
                    (if (i32.eq (local.get $char) (i32.const 32)) ;; Space
                      (then)
                      (else
                        (if (i32.eq (local.get $char) (i32.const 123)) ;; {
                          (then
                            ;; Move to RuleReset
                            (i32.store8 (global.get $intmemstack_ptr) (i32.const 2))

                            ;; Exit
                            (local.set $state (i32.const 9))

                            ;; selectorEnd
                            (i32.store offset=5
                              (global.get $tagmemstack_ptr)
                              (i32.add (local.get $lastNonWhitespace) (i32.const 1))
                            )
                          )
                          (else
                            ;; ERROR
                          )
                        )
                      )
                    )
                  )
                )
              )

              (else
                ;; RuleReset
                (if (i32.eq (local.get $state) (i32.const 2))
                  (then
                    (if (call $identifierToken (local.get $char))
                      (then
                        ;; Tag
                        (i32.store8
                          (global.get $tagmemstack_ptr)
                          (i32.const 2) ;; Property
                        )

                        (local.set $state (i32.const 3)) ;; PropStart

                        ;; propertyStart
                        (i32.store offset=9
                          (global.get $tagmemstack_ptr)
                          (local.get $idx_bytes)
                        )
                      )
                    )
                  )
                  (else
                    (if (i32.eq (local.get $state) (i32.const 3)) ;; PropStart
                      (then
                        (if (call $identifierToken (local.get $char))
                          (then
                            (local.set $lastNonWhitespace (local.get $idx_bytes))
                          )
                          (else
                            (if (i32.eq (local.get $char (i32.const 58))) ;; :
                              (then
                                ;; Move to ValueReset
                                ;;(i32.store8 (global.get $intmemstack_ptr) (i32.const 4))
                                (local.set $state (i32.const 4))

                                ;; propertyEnd
                                (i32.store offset=13
                                  (global.get $tagmemstack_ptr)
                                  (i32.add (local.get $lastNonWhitespace) (i32.const 1))
                                )
                              )
                              (else
                                ;; ERROR unidentified token
                              )
                            )
                          )
                        )
                      )
                      (else
                        ;; ValueReset
                        (if (i32.eq (local.get $state (i32.const 4)))
                          (then
                            (if (call $identifierToken (local.get $char)) ;; Initially set to an identifier
                              (then
                                (i32.store8 offset=17
                                  (global.get $tagmemstack_ptr)
                                  (i32.const 3) ;; Identifier
                                )
                                (local.set $state (i32.const 9)) ;; TODO remove
                              )
                              (else
                                (if (i32.eq (local.get $char) (i32.const 34)) ;; "
                                  (then
                                    (i32.store8 offset=17
                                      (global.get $tagmemstack_ptr)
                                      (i32.const 2) ;; String
                                    )
                                    (local.set $state (i32.const 9)) ;; TODO remove
                                  )
                                  (else
                                    (if (call $whitespaceToken (local.get $char))
                                      (then) ;; Continue.
                                      (else
                                        (i32.store8 offset=17
                                          (global.get $tagmemstack_ptr)
                                          (i32.const 9) ;; Unknown
                                        )
                                      )
                                    )
                                  ) 
                                ) 
                              )
                            )
                          )
                          (else
                            ;; TODO ValueStart
                            (if (i32.eq (local.get $state (i32.const 5)))
                              (then)
                              (else)
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )

        ;; increment the loop counter
        (local.set $idx (i32.add (local.get $idx) (i32.const 1)))

        ;; stop the loop if the loop counter is equal the array length
        (if (i32.eq (local.get $idx) (local.get $array_length))
          (then
            ;; Tag
            (i32.store8
              (global.get $tagmemstack_ptr)
              (i32.const 0) ;; EOF
            )

            ;; Reset state
            (i32.store8 (global.get $intmemstack_ptr) (i32.const 0))

            ;; Exit
            (local.set $state (i32.const 9))
          )
        )

        (br_if 1 (i32.eq (local.get $state) (i32.const 9)))
        (br 0)
      )
    )

    ;; Byte Index
    (i32.store
      (global.get $memstack_ptr)
      (local.get $idx_bytes)
    )

    ;; Return the starting point of our memory block, which contains the return information
    (global.get $memstack_ptr)
  )
  (export "parse" (func $parse))
)