/**
 * react-native SafeAreaView → safe-area-context (Android APK düzeltmesi)
 * Usage: node scripts/migrate-safe-area.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'src');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function migrateFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('SafeAreaView')) return false;
  if (content.includes('@/components/common/Screen')) return false;

  const isTab = file.includes(`${path.sep}(tabs)${path.sep}`);
  const component = isTab ? 'TabScreen' : 'Screen';
  const rel = path.relative(srcRoot, file).replace(/\\/g, '/');

  // Skip if already using safe-area-context SafeAreaView with edges
  if (content.includes("from 'react-native-safe-area-context'") && content.includes('edges=')) {
    return false;
  }

  content = content.replace(/\bSafeAreaView\b/g, (match, offset) => {
    // don't replace in import lines we'll handle separately
    const before = content.slice(Math.max(0, offset - 80), offset);
    if (before.includes('import')) return match;
    return component;
  });

  // Remove Screen/TabScreen mistaken replacements from react-native import
  content = content.replace(
    /import\s+\{([^}]*)\}\s+from\s+'react-native';/g,
    (full, imports) => {
      const parts = imports
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'SafeAreaView' && s !== 'Screen' && s !== 'TabScreen');
      if (parts.length === 0) return full.replace(full, '');
      return `import { ${parts.join(', ')} } from 'react-native';`;
    }
  );

  if (!content.includes(`from '@/components/common/Screen'`)) {
    const importLine = `import { ${component} } from '@/components/common/Screen';\n`;
    const reactNativeIdx = content.indexOf("from 'react-native'");
    if (reactNativeIdx !== -1) {
      const lineEnd = content.indexOf('\n', reactNativeIdx);
      content = content.slice(0, lineEnd + 1) + importLine + content.slice(lineEnd + 1);
    } else {
      content = importLine + content;
    }
  }

  fs.writeFileSync(file, content);
  console.log(` migrated: ${rel} → ${component}`);
  return true;
}

let count = 0;
for (const file of walk(srcRoot)) {
  if (migrateFile(file)) count++;
}
console.log(`Done. ${count} files updated.`);
