cc=clang

lib/dsl-release.wasm: src/parser.c
	$(cc) -o $@ -O3 --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export-all $^

src/dsl-debug.wasm: src/parser.c
	$(cc) -o $@ --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export=parse -Wl,--export=reset $^

watch:
	ls src/parser.c | entr make src/dsl-debug.wasm
.PHONY: watch