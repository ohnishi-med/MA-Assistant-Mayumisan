import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Object.defineProperty(global, '__filename', { value: __filename });
Object.defineProperty(global, '__dirname', { value: __dirname });
