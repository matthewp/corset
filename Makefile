cc=clang

lib/main.wasm: src/parser.c
	$(cc) -o $@ -O3 -ffreestanding --target=wasm32 -nostdlib -Wl,--no-entry $^

src/main.wasm: src/parser.c
	$(cc) -D DEBUG_BUILD -o $@ --target=wasm32 -nostdlib -Wl,--no-entry $^

watch:
	ls src/parser.c | entr make src/main.wasm
.PHONY: watch