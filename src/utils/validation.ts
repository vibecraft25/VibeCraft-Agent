import { VisualizationType } from '../types';
import fs from 'fs-extra';
import path from 'path';

export const VALID_VISUALIZATION_TYPES: VisualizationType[] = [
  'time-series',
  'geo-spatial',
  'kpi-dashboard',
  'comparison'
];

export function validateSqlitePath(sqlitePath: string): void {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite file not found: ${sqlitePath}`);
  }
  
  const stats = fs.statSync(sqlitePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${sqlitePath}`);
  }
  
  // 간단한 SQLite 파일 검증 (시그니처 확인)
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(sqlitePath, 'r');
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);
  
  const signature = buffer.toString('utf8', 0, 15);
  if (signature !== 'SQLite format 3') {
    throw new Error('File is not a valid SQLite database');
  }
}

export function validateVisualizationType(type: string): VisualizationType {
  if (!VALID_VISUALIZATION_TYPES.includes(type as VisualizationType)) {
    throw new Error(
      `Invalid visualization type: ${type}. Valid types are: ${VALID_VISUALIZATION_TYPES.join(', ')}`
    );
  }
  return type as VisualizationType;
}

export function validateOutputDir(dir: string): void {
  const resolvedDir = path.resolve(dir);
  const parentDir = path.dirname(resolvedDir);

  // Note: We only validate that the parent directory exists and is writable.
  // The output-dir itself will be auto-created by RequestNormalizer if it doesn't exist.
  // This allows users to specify non-existent paths like "./my-new-dashboard"

  // 부모 디렉토리가 존재하는지 확인
  if (!fs.existsSync(parentDir)) {
    throw new Error(`Parent directory does not exist: ${parentDir}`);
  }

  // 디렉토리가 이미 존재하는 경우
  if (fs.existsSync(resolvedDir)) {
    const stats = fs.statSync(resolvedDir);
    if (!stats.isDirectory()) {
      throw new Error(`Output path exists but is not a directory: ${resolvedDir}`);
    }

    // output 디렉토리가 존재해도 OK - 그 안에 새로운 프로젝트 폴더를 생성할 것임
    // 쓰기 권한만 확인
    try {
      fs.accessSync(resolvedDir, fs.constants.W_OK);
    } catch {
      throw new Error(`No write permission for output directory: ${resolvedDir}`);
    }
  } else {
    // 디렉토리가 없으면 부모 디렉토리에 쓰기 권한이 있는지 확인
    try {
      fs.accessSync(parentDir, fs.constants.W_OK);
    } catch {
      throw new Error(`No write permission for parent directory: ${parentDir}`);
    }
  }
}