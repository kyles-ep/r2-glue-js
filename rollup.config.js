import typescript2 from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import multiEntry from 'rollup-plugin-multi-entry';
import serve from 'rollup-plugin-serve';
import path from 'path';

const pkg = require('./package.json');

const plugins = [resolve(), commonjs(), typescript2()];

const baseModuleEntries = ['./src/lib/dispatcher.ts','./src/lib/messageHandler.ts'];

const buildModuleEntry = (input) => {
  const moduleName = path.basename(path.resolve(input, '..'));
  return {
    input,
    output: {
      file: `./dist/modules/ReadiumGlue-${moduleName}.js`,
      format: 'iife',
      name: `ReadiumGlue.${moduleName}`,
      sourcemap: true,
      globals: {
        [path.resolve(baseModuleEntries[0])]: 'ReadiumGlue',
        [path.resolve(baseModuleEntries[1])]: 'ReadiumGlue',
      },
    },
    external: [path.resolve(baseModuleEntries[0]), path.resolve(baseModuleEntries[1])],
    plugins,
  };
};

export default [
  {
    input: baseModuleEntries,
    output: {
      file: './dist/modules/ReadiumGlue-base.js',
      format: 'iife',
      name: 'ReadiumGlue',
      sourcemap: true,
    },
    plugins: [...plugins, multiEntry()],
  },
  buildModuleEntry('./src/modules/eventHandling/index.ts'),
  {
    input: './src/clients.ts',
    output: [
      {
        file: pkg.main,
        format: 'umd',
        name: 'ReadiumGlue',
        sourcemap: true,
      },
    ],
    plugins,
  },
  {
    input: './src/handlers.ts',
    output: [
      {
        file: './dist/ReadiumGlue-payload.js',
        format: 'iife',
        name: 'ReadiumGlue',
        sourcemap: true,
      },
    ],
    plugins: process.env.SERVE
      ? [
        ...plugins,
        serve({
          // Launch in browser (default: false)
          open: true,

          // Multiple folders to serve from
          contentBase: ['.', 'examples/demo'],

          // Options used in setting up server
          host: '0.0.0.0',
          port: 8080,

          headers: {
            'Cache-Control': 'no-cache, must-revalidate',
          },
        }),
      ]
      : plugins,
  },
];