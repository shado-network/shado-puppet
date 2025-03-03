import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm'],
  splitting: false,
  clean: true,
  dts: true,
})
