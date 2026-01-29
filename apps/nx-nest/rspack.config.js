const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');
const { join } = require('path');

module.exports = {
  entry: {
    main: join(__dirname, 'src/main.ts'),
  },
  output: {
    path: join(__dirname, '../../dist/apps/nx-nest'),
    clean: true,
  },
  resolve: {
    alias: {
      '@nx-shay/shared': join(__dirname, '../../libs/shared/src/index.ts'),
      '@nx-shay/backend-filters': join(__dirname, '../../libs/backend/filters/src/index.ts'),
    },
    // extensions: ['.ts', '.js', '.json'],  // file extensions to resolve automatically
  },

  // --- Source maps ---
  // devtool: 'source-map',           // 'eval' | 'source-map' | 'cheap-module-source-map' | false

  // --- Node.js polyfill behavior ---
  // node: {
  //   __dirname: false,              // don't polyfill __dirname (use real path at runtime)
  //   __filename: false,
  // },

  // --- Build target ---
  // target: 'node18',                // can specify node version e.g. 'node18', 'node20'

  // --- Persistent build cache ---
  // cache: true,                     // or { type: 'filesystem' } for disk-based cache

  // --- Watch options ---
  // watchOptions: {
  //   ignored: /node_modules/,       // ignore node_modules for faster watching
  //   poll: 1000,                    // poll interval in ms (for network drives/VMs)
  //   aggregateTimeout: 300,         // delay rebuild after first change (ms)
  // },

  // --- Custom loaders ---
  // module: {
  //   rules: [
  //     { test: /\.yaml$/, use: 'yaml-loader' },
  //     { test: /\.graphql$/, use: 'graphql-tag/loader' },
  //   ],
  // },

  // --- Chunk splitting ---
  // optimization: {
  //   splitChunks: { chunks: 'all' },  // split shared code into separate chunks
  //   minimize: true,                  // enable minimizer (terser/swc)
  // },

  plugins: [
    new NxAppRspackPlugin({
      target: 'node',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      // Externalize all node_modules
      externalDependencies: 'all',

      // --- Additional NxAppRspackPlugin options ---
      // skipTypeChecking: true,        // skip TS type-checking within the plugin
      // sourceMap: true,               // emit source maps (true | false | 'hidden')
      // extractLicenses: true,         // extract licenses to separate file
      // namedChunks: true,             // use entry names for chunk filenames
      // vendorChunk: true,             // separate vendor bundle
      // runtimeChunk: true,            // separate runtime bundle
      // extractCss: true,              // extract CSS to files (web targets only)
      // outputPath: '../../dist/apps/nx-nest',  // override output dir

      // --- File replacements ---
      // fileReplacements: [
      //   { replace: './src/environments/environment.ts', with: './src/environments/environment.prod.ts' }
      // ],
    }),
    // Plugin to modify externals after NxAppRspackPlugin - bundle @nx-shay/shared
    {
      apply(compiler) {
        compiler.hooks.afterEnvironment.tap('BundleSharedPlugin', () => {
          const originalExternals = compiler.options.externals;

          compiler.options.externals = async function (ctx, callback) {
            const request = ctx.request;

            // Bundle @nx-shay/shared (resolve via alias)
            if (request === '@nx-shay/shared' || request.startsWith('@nx-shay/shared/')) {
              return callback();
            }

            // Bundle @nx-shay/backend-filters (resolve via alias)
            if (request === '@nx-shay/backend-filters' || request.startsWith('@nx-shay/backend-filters/')) {
              return callback();
            }

            // Call original externals for everything else
            if (typeof originalExternals === 'function') {
              return originalExternals(ctx, callback);
            } else if (Array.isArray(originalExternals)) {
              const processNext = (index) => {
                if (index >= originalExternals.length) {
                  return callback();
                }
                const ext = originalExternals[index];
                if (typeof ext === 'function') {
                  ext(ctx, (err, result) => {
                    if (err || result) return callback(err, result);
                    processNext(index + 1);
                  });
                } else if (typeof ext === 'object' && ext[request]) {
                  return callback(null, ext[request]);
                } else {
                  processNext(index + 1);
                }
              };
              processNext(0);
            } else {
              callback();
            }
          };
        });
      },
    },
  ],
};
