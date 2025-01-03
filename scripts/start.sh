echo "START"
echo "arguments: $*"

tsc && nodemon --exec 'node --loader ts-node/esm' src/index.ts -- $*