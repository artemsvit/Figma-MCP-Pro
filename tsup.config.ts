// @ts-ignore
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: [
    '@modelcontextprotocol/sdk'
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.banner = {
      js: '#!/usr/bin/env node',
    };
  },
}); 