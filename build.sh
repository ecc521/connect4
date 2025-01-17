echo "If emcc does not exist, but is installed, make sure to source emsdk/emsdk_env.sh"
mkdir build
emcc -Oz -o build/analyze.js analyze.cpp Solver.cpp -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS='["_free", "_malloc"]' -s EXPORTED_RUNTIME_METHODS='["FS", "UTF8ToString", "allocateUTF8"]' -s INITIAL_MEMORY=200MB -s ALLOW_MEMORY_GROWTH -s WASM=0 --memory-init-file=0 