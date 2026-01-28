const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/nx-nest'),
    clean: true,
  },
  resolve: {
    alias: {
      '@nx-shay/shared': join(__dirname, '../../libs/shared/src/index.ts'),
      '@nx-shay/backend-filters': join(__dirname, '../../libs/backend/filters/src/index.ts'),
    },
  },
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
