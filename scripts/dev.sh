echo "DEV"
echo "arguments: $*"

tsc && nodemon --watch src --watch include --ext ts --exec 'node --loader ts-node/esm' src/index.ts -- $*