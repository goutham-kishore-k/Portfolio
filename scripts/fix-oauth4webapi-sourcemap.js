const fs = require('fs');
const path = require('path');

const candidatePaths = [
  path.join(__dirname, '..', 'node_modules', 'openid-client', 'node_modules', 'oauth4webapi', 'build', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'oauth4webapi', 'build', 'index.js'),
];

const webpackConfigPath = path.join(__dirname, '..', 'node_modules', 'react-scripts', 'config', 'webpack.config.js');
const packageRoots = [
  path.join(__dirname, '..', 'node_modules', 'openid-client'),
  path.join(__dirname, '..', 'node_modules', '@auth0', 'auth0-auth-js'),
  path.join(__dirname, '..', 'node_modules', '@auth0', 'auth0-spa-js'),
];

for (const filePath of candidatePaths) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const patched = original.replace(/\n?\/\/#[ \t]+sourceMappingURL=index\.js\.map\s*$/m, '');

  if (patched !== original) {
    fs.writeFileSync(filePath, patched, 'utf8');
    console.log(`Patched ${filePath}`);
  }
}

if (fs.existsSync(webpackConfigPath)) {
  const originalWebpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
  const defaultExclude = "exclude: /@babel(?:\\/|\\\\{1,2})runtime/,";
  const legacyPatchedExclude = "exclude: /(@babel(?:\\/|\\\\{1,2})runtime|openid-client|oauth4webapi)/,";
  const desiredExclude = "exclude: /(@babel(?:\\/|\\\\{1,2})runtime|openid-client|oauth4webapi|@auth0)/,";

  // Update every matching rule (source-map-loader and babel-loader dependency pass).
  let patchedWebpackConfig = originalWebpackConfig
    .split(defaultExclude)
    .join(desiredExclude)
    .split(legacyPatchedExclude)
    .join(desiredExclude);

  if (patchedWebpackConfig !== originalWebpackConfig) {
    fs.writeFileSync(webpackConfigPath, patchedWebpackConfig, 'utf8');
    console.log(`Patched ${webpackConfigPath}`);
  }
}

for (const rootPath of packageRoots) {
  if (!fs.existsSync(rootPath)) {
    continue;
  }

  const stack = [rootPath];
  while (stack.length) {
    const currentDir = stack.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (!entry.name.endsWith('.js')) {
        continue;
      }

      const original = fs.readFileSync(entryPath, 'utf8');
      const marker = '//# sourceMappingURL=';
      const markerIndex = original.lastIndexOf(marker);
      const patched = markerIndex >= 0 ? original.slice(0, markerIndex).replace(/\s*$/, '') : original;

      if (patched !== original) {
        fs.writeFileSync(entryPath, patched, 'utf8');
        console.log(`Patched ${entryPath}`);
      }
    }
  }
}
