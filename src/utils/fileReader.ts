import fs from 'fs';
import path from 'path';

export function readStrategyJson(filePath: string): any {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`El archivo de estrategia no existe: ${absolutePath}`);
  }
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(fileContent);
}
