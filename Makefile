dsl.wasm: dsl.wat
	wat2wasm $^ -o $@

watch:
	ls dsl.wat | entr make dsl.wasm
.PHONY: watch