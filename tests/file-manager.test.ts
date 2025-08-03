import { FileManager } from '../src/utils/file-manager';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('FileManager', () => {
  const testDir = path.join(__dirname, 'test-file-manager');
  const testFile = path.join(testDir, 'test.txt');
  const testJsonFile = path.join(testDir, 'test.json');
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });
  
  afterEach(async () => {
    await fs.remove(testDir);
  });
  
  describe('ensureDirectory', () => {
    test('should create directory if not exists', async () => {
      const newDir = path.join(testDir, 'new-dir');
      
      await FileManager.ensureDirectory(newDir);
      
      const exists = await fs.pathExists(newDir);
      expect(exists).toBe(true);
    });
    
    test('should not throw if directory exists', async () => {
      await expect(FileManager.ensureDirectory(testDir)).resolves.not.toThrow();
    });
  });
  
  describe('file operations', () => {
    beforeEach(async () => {
      await fs.writeFile(testFile, 'test content');
    });
    
    test('copyFile should copy file', async () => {
      const destFile = path.join(testDir, 'copy.txt');
      
      await FileManager.copyFile(testFile, destFile);
      
      const exists = await fs.pathExists(destFile);
      const content = await fs.readFile(destFile, 'utf8');
      
      expect(exists).toBe(true);
      expect(content).toBe('test content');
    });
    
    test('moveFile should move file', async () => {
      const destFile = path.join(testDir, 'moved.txt');
      
      await FileManager.moveFile(testFile, destFile);
      
      const srcExists = await fs.pathExists(testFile);
      const destExists = await fs.pathExists(destFile);
      
      expect(srcExists).toBe(false);
      expect(destExists).toBe(true);
    });
    
    test('deleteFile should remove file', async () => {
      await FileManager.deleteFile(testFile);
      
      const exists = await fs.pathExists(testFile);
      expect(exists).toBe(false);
    });
    
    test('exists should check file existence', async () => {
      const exists = await FileManager.exists(testFile);
      const notExists = await FileManager.exists(path.join(testDir, 'not-exists.txt'));
      
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });
  
  describe('JSON operations', () => {
    const testData = { name: 'test', value: 123 };
    
    test('writeJson and readJson should work', async () => {
      await FileManager.writeJson(testJsonFile, testData);
      
      const data = await FileManager.readJson(testJsonFile);
      
      expect(data).toEqual(testData);
    });
  });
  
  describe('text operations', () => {
    test('writeText and readText should work', async () => {
      const content = 'Hello, World!\nLine 2';
      
      await FileManager.writeText(testFile, content);
      const readContent = await FileManager.readText(testFile);
      
      expect(readContent).toBe(content);
    });
  });
  
  describe('directory operations', () => {
    test('isEmpty should check directory emptiness', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);
      
      const isEmpty = await FileManager.isEmpty(emptyDir);
      expect(isEmpty).toBe(true);
      
      await fs.writeFile(path.join(emptyDir, 'file.txt'), 'content');
      const notEmpty = await FileManager.isEmpty(emptyDir);
      expect(notEmpty).toBe(false);
    });
    
    test('isEmpty should return true for non-existent directory', async () => {
      const isEmpty = await FileManager.isEmpty(path.join(testDir, 'not-exists'));
      expect(isEmpty).toBe(true);
    });
    
    test('cleanDirectory should remove all files except hidden', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');
      await fs.writeFile(path.join(testDir, '.hidden'), 'hidden');
      
      await FileManager.cleanDirectory(testDir);
      
      const files = await fs.readdir(testDir);
      expect(files).toEqual(['.hidden']);
    });
    
    test('createTempDirectory should create unique temp dir', async () => {
      const tempDir1 = await FileManager.createTempDirectory('test');
      const tempDir2 = await FileManager.createTempDirectory('test');
      
      expect(tempDir1).not.toBe(tempDir2);
      expect(tempDir1).toContain('test-');
      expect(await fs.pathExists(tempDir1)).toBe(true);
      expect(await fs.pathExists(tempDir2)).toBe(true);
      
      // Clean up
      await fs.remove(tempDir1);
      await fs.remove(tempDir2);
    });
  });
  
  describe('file info operations', () => {
    test('calculateFileHash should compute file hash', async () => {
      await fs.writeFile(testFile, 'test content');
      
      const hash = await FileManager.calculateFileHash(testFile);
      
      // SHA256 hash of 'test content'
      expect(hash).toBe('6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72');
    });
    
    test('getFileSize should return file size', async () => {
      const content = 'Hello, World!';
      await fs.writeFile(testFile, content);
      
      const size = await FileManager.getFileSize(testFile);
      
      expect(size).toBe(Buffer.from(content).length);
    });
    
    test('getDirectorySize should calculate total size', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), '12345');
      await fs.writeFile(path.join(testDir, 'file2.txt'), '67890');
      
      const subDir = path.join(testDir, 'sub');
      await fs.ensureDir(subDir);
      await fs.writeFile(path.join(subDir, 'file3.txt'), 'abc');
      
      const size = await FileManager.getDirectorySize(testDir);
      
      expect(size).toBe(13); // 5 + 5 + 3
    });
    
    test('formatFileSize should format bytes correctly', () => {
      expect(FileManager.formatFileSize(0)).toBe('0 B');
      expect(FileManager.formatFileSize(512)).toBe('512 B');
      expect(FileManager.formatFileSize(1024)).toBe('1.00 KB');
      expect(FileManager.formatFileSize(1536)).toBe('1.50 KB');
      expect(FileManager.formatFileSize(1048576)).toBe('1.00 MB');
      expect(FileManager.formatFileSize(1073741824)).toBe('1.00 GB');
      expect(FileManager.formatFileSize(123456789)).toBe('118 MB');
    });
  });
  
  describe('listFiles', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'file2.js'), 'content');
      await fs.writeFile(path.join(testDir, '.hidden'), 'content');
      
      const subDir = path.join(testDir, 'sub');
      await fs.ensureDir(subDir);
      await fs.writeFile(path.join(subDir, 'file3.txt'), 'content');
    });
    
    test('should list files non-recursively', async () => {
      const files = await FileManager.listFiles(testDir);
      
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.js');
      expect(files).not.toContain('.hidden');
      expect(files).not.toContain('sub/file3.txt');
    });
    
    test('should list files recursively', async () => {
      const files = await FileManager.listFiles(testDir, { recursive: true });
      
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.js');
      expect(files).toContain(path.join('sub', 'file3.txt'));
    });
    
    test('should filter by extensions', async () => {
      const files = await FileManager.listFiles(testDir, { extensions: ['.txt'] });
      
      expect(files).toContain('file1.txt');
      expect(files).not.toContain('file2.js');
    });
    
    test('should include hidden files when specified', async () => {
      const files = await FileManager.listFiles(testDir, { includeHidden: true });
      
      expect(files).toContain('.hidden');
    });
  });
  
  describe('path utilities', () => {
    test('path utilities should work correctly', () => {
      const filePath = '/home/user/project/file.txt';
      
      expect(FileManager.getBasename(filePath)).toBe('file.txt');
      expect(FileManager.getBasename(filePath, '.txt')).toBe('file');
      expect(FileManager.getDirname(filePath)).toBe('/home/user/project');
      expect(FileManager.getExtension(filePath)).toBe('.txt');
      expect(FileManager.isAbsolute(filePath)).toBe(true);
      expect(FileManager.isAbsolute('relative/path')).toBe(false);
      
      expect(FileManager.joinPath('a', 'b', 'c')).toBe(path.join('a', 'b', 'c'));
      expect(FileManager.resolvePath('.')).toBe(process.cwd());
      
      expect(FileManager.getRelativePath('/a/b', '/a/b/c/d')).toBe(path.join('c', 'd'));
    });
  });
});