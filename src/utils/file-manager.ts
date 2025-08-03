import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export class FileManager {
  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }
  
  static async copyFile(src: string, dest: string): Promise<void> {
    await fs.copy(src, dest);
  }
  
  static async moveFile(src: string, dest: string): Promise<void> {
    await fs.move(src, dest);
  }
  
  static async deleteFile(filePath: string): Promise<void> {
    await fs.remove(filePath);
  }
  
  static async readJson(filePath: string): Promise<any> {
    return await fs.readJson(filePath);
  }
  
  static async writeJson(filePath: string, data: any): Promise<void> {
    await fs.writeJson(filePath, data, { spaces: 2 });
  }
  
  static async readText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }
  
  static async writeText(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  static async exists(filePath: string): Promise<boolean> {
    return await fs.pathExists(filePath);
  }
  
  static async isEmpty(dirPath: string): Promise<boolean> {
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(f => !f.startsWith('.')).length === 0;
    } catch (error) {
      // 디렉토리가 없으면 빈 것으로 간주
      return true;
    }
  }
  
  static async createTempDirectory(prefix: string = 'vibecraft'): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.ensureDir(tmpDir);
    return tmpDir;
  }
  
  static async cleanDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (!file.startsWith('.')) {
          await fs.remove(path.join(dirPath, file));
        }
      }
    } catch (error) {
      // 디렉토리가 없으면 무시
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  static async calculateFileHash(filePath: string, algorithm: string = 'sha256'): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash(algorithm).update(content).digest('hex');
  }
  
  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }
  
  static async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            try {
              const stats = await fs.stat(fullPath);
              totalSize += stats.size;
            } catch {
              // 파일 접근 실패 시 무시
            }
          }
        }
      } catch (error) {
        // 디렉토리 접근 실패 시 무시
        if ((error as any).code !== 'EACCES') {
          throw error;
        }
      }
    };
    
    await walkDir(dirPath);
    return totalSize;
  }
  
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    // 소수점 자리수 결정
    let decimals: number;
    if (unitIndex === 0) {
      decimals = 0; // Bytes는 정수로
    } else if (size >= 100) {
      decimals = 0; // 100 이상은 정수로
    } else if (size >= 10) {
      decimals = 1; // 10-99는 소수점 1자리
    } else {
      decimals = 2; // 10 미만은 소수점 2자리
    }
    
    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
  }
  
  static async listFiles(
    dirPath: string, 
    options?: { 
      recursive?: boolean; 
      includeHidden?: boolean;
      extensions?: string[];
    }
  ): Promise<string[]> {
    const files: string[] = [];
    const { recursive = false, includeHidden = false, extensions } = options || {};
    
    const walkDir = async (dir: string, basePath: string = ''): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(basePath, entry.name);
          
          // Hidden 파일 체크
          if (!includeHidden && entry.name.startsWith('.')) {
            continue;
          }
          
          if (entry.isDirectory()) {
            if (recursive && entry.name !== 'node_modules') {
              await walkDir(fullPath, relativePath);
            }
          } else if (entry.isFile()) {
            // 확장자 필터
            if (extensions && extensions.length > 0) {
              const ext = path.extname(entry.name).toLowerCase();
              if (!extensions.includes(ext)) {
                continue;
              }
            }
            files.push(relativePath);
          }
        }
      } catch (error) {
        // 디렉토리 접근 실패 시 무시
        if ((error as any).code !== 'EACCES') {
          throw error;
        }
      }
    };
    
    await walkDir(dirPath);
    return files;
  }
  
  static async copyDirectory(
    src: string, 
    dest: string,
    options?: {
      overwrite?: boolean;
      filter?: (src: string, dest: string) => boolean | Promise<boolean>;
    }
  ): Promise<void> {
    await fs.copy(src, dest, options as any);
  }
  
  static async createSymlink(target: string, linkPath: string): Promise<void> {
    await fs.ensureSymlink(target, linkPath);
  }
  
  static async getFileStats(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
  }> {
    const stats = await fs.stat(filePath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink()
    };
  }
  
  static async ensureFile(filePath: string): Promise<void> {
    await fs.ensureFile(filePath);
  }
  
  static async appendFile(filePath: string, content: string): Promise<void> {
    await fs.appendFile(filePath, content, 'utf-8');
  }
  
  static resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }
  
  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }
  
  static getBasename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }
  
  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }
  
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }
  
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }
  
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }
}