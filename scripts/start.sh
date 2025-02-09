echo "scripts/START"
echo "$*"

tsc && node --loader ts-node/esm src/index.ts $*