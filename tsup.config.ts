import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  //
  target: 'es2022',
  platform: 'node',
  format: ['esm'],
  //
  splitting: false,
  clean: true,
  dts: true,
  minify: true,
  external: [],
  treeshake: true,
  //
  env: {
    NODE_ENV: 'production',
  },
  //
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: '.js',
    }
  },
})
