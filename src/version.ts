import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json as the single source of truth
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading version from package.json:', error);
    return '0.0.0'; // Fallback version
  }
}

export const VERSION = getVersion(); 