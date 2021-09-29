dsl.wasm: dsl.wat
	wat2wasm $^ -o $@

dsl3.wasm: dsl3.zig
	zig build-lib $^ -target wasm32-freestanding -dynamic

watch:
	ls dsl.wat | entr make dsl.wasm
.PHONY: watch