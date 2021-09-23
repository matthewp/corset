dsl.wasm: dsl.wat
	wat2wasm $^ -o $@