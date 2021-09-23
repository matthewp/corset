;; https://learnxinyminutes.com/docs/wasm/
;; https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format

(module
  (import "js" "mem" (memory 1))

  (global $memstack_ptr (mut i32) (i32.const 32768))
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

  (func $identifierToken (param $t i32) (result i32)
    (local $val i32)
    (local.set $val (i32.const 1))
    (block $b1
      (br_if $b1 (call $between (local.get $t) (i32.const 97) (i32.const 122)))
      (br_if $b1 (i32.eq (local.get $t) (i32.const 35))) ;; #
      (local.set $val (i32.const 0))
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

  (func $innerSelectorToken (param $t i32) (result i32)
    (local $val i32)
    (local.set $val (i32.const 1))
    (block $b0
      (br_if $b0 (call $selectorToken (local.get $t)))
      (br_if $b0 (i32.eq (local.get $t) (i32.const 32))) ;; space
      (local.set $val (i32.const 0))
    )
    (local.get $val)
  )

  (func $parse (param $array_length i32) (result i32)
    ;; declare the loop counter
    (local $idx i32)
    (local $idx_bytes i32)

    ;; declare a variable for storing the value loaded from memory
    (local $char i32)
    (local $lastNonWhitespace i32)

    (local $type i32)
    (local $local_memstack_ptr i32)
    
    (local.set $idx_bytes (i32.const 0))
    (local.set $type (i32.const 0))
    (local.set $local_memstack_ptr (global.get $memstack_ptr))

    (block
      (loop
        ;; this sets idx_bytes to bytes offset of the value we're interested in.
        (local.set $idx_bytes (i32.mul (local.get $idx) (i32.const 1)))

        ;; get the value of the array from memory:
        (local.set $char (i32.load8_u (local.get $idx_bytes)))

        ;; Reset state
        (if (i32.eq (local.get $type) (i32.const 0))
          (then
            (if (call $selectorToken (local.get $char))
              (then
                (local.set $lastNonWhitespace (local.get $idx_bytes))
                (local.set $type (i32.const 1))

                (i32.store
                  (local.get $local_memstack_ptr)
                  (local.get $type)
                )

                (i32.store offset=1
                  (local.get $local_memstack_ptr)
                  (local.get $idx_bytes)
                )
              )
            )
          )
        )

        ;; Selector state
        (if (i32.eq (local.get $type) (i32.const 1))
          (then
            (if (call $selectorToken (local.get $char))
              (then
                (local.set $lastNonWhitespace (local.get $idx_bytes))
              )
              (else
                (if (i32.eq (local.get $char) (i32.const 32))
                  (then)
                  (else
                    (local.set $type (i32.const 3))
                    (i32.store offset=2
                      (local.get $local_memstack_ptr)
                      (i32.add (local.get $lastNonWhitespace) (i32.const 1))
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
        (br_if 1 (i32.eq (local.get $idx) (local.get $array_length)))
        (br 0)
      )
    )

    (global.get $memstack_ptr)
  )
  (export "parse" (func $parse))
)