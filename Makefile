cc=clang

lib/dsl.wasm: src/parser.c
	$(cc) -o $@ -O3 -ffreestanding --target=wasm32 -nostdlib -Wl,--no-entry $^

src/dsl.wasm: src/parser.c
	$(cc) -D DEBUG_BUILD -o $@ --target=wasm32 -nostdlib -Wl,--no-entry $^

watch:
	ls src/parser.c | entr make src/dsl-debug.wasm
.PHONY: watch