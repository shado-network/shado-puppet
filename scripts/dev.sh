echo "scripts/DEV"
echo "$*"

tsc && nodemon --watch src --watch include --ext ts --exec "node --loader ts-node/esm" src/index.ts -- $*