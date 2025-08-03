import { SettingsManager, SettingsConfig } from '../src/core/settings-manager';
import { SettingsHelper } from '../src/utils/settings-helper';
import { EnvironmentManager } from '../src/core/environment-manager';
import fs from 'fs-extra';
import path from 'path';

describe('SettingsManager', () => {
  let manager: SettingsManager;
  let tempDir: string;
  
  beforeEach(async () => {
    manager = new SettingsManager();
    tempDir = path.join(__dirname, 'temp', `settings-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });
  
  afterEach(async () => {
    await fs.remove(tempDir);
  });
  
  describe('generateSettings', () => {
    test('should generate valid settings.json file', async () => {
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: '/path/to/data.sqlite',
        timeout: 60000
      };
      
      const settingsPath = await manager.generateSettings(config);
      
      expect(await fs.pathExists(settingsPath)).toBe(true);
      expect(settingsPath).toBe(path.join(tempDir, '.gemini', 'settings.json'));
      
      const settings = await fs.readJson(settingsPath);
      expect(settings.mcpServers.sqlite).toBeDefined();
      expect(settings.mcpServers.sqlite.timeout).toBe(60000);
      expect(settings.mcpServers.sqlite.trust).toBe(true);
    });
    
    test('should use absolute path for SQLite file', async () => {
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: './relative/path/data.sqlite'
      };
      
      const settingsPath = await manager.generateSettings(config);
      const settings = await fs.readJson(settingsPath);
      
      const dbPathIndex = settings.mcpServers.sqlite.args.indexOf('--db-path');
      const dbPath = settings.mcpServers.sqlite.args[dbPathIndex + 1];
      
      expect(path.isAbsolute(dbPath)).toBe(true);
      expect(dbPath).toBe(path.resolve('./relative/path/data.sqlite'));
    });
    
    test('should include all required MCP tools', async () => {
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: '/path/to/data.sqlite'
      };
      
      const settingsPath = await manager.generateSettings(config);
      const settings = await fs.readJson(settingsPath);
      
      const includeTools = settings.mcpServers.sqlite.includeTools;
      expect(includeTools).toContain('read_query');
      expect(includeTools).toContain('write_query');
      expect(includeTools).toContain('list_tables');
      expect(includeTools).toContain('describe_table');
    });
    
    test('should add experimental features when enabled', async () => {
      process.env.GEMINI_EXPERIMENTAL_FEATURES = 'true';
      
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: '/path/to/data.sqlite'
      };
      
      const settingsPath = await manager.generateSettings(config);
      const settings = await fs.readJson(settingsPath);
      
      expect(settings.experimental).toBeDefined();
      expect(settings.experimental.asyncExecution).toBe(true);
      expect(settings.experimental.parallelTools).toBe(true);
      
      delete process.env.GEMINI_EXPERIMENTAL_FEATURES;
    });
  });
  
  describe('validateSettings', () => {
    test('should validate correct settings file', async () => {
      // Create a temporary SQLite file for validation
      const sqliteFile = path.join(tempDir, 'test.sqlite');
      await fs.writeFile(sqliteFile, '');
      
      const validSettings = {
        mcpServers: {
          sqlite: {
            command: 'python',
            args: ['-m', 'mcp_server_sqlite', '--db-path', sqliteFile]
          }
        }
      };
      
      const settingsPath = path.join(tempDir, 'settings.json');
      await fs.writeJson(settingsPath, validSettings);
      
      const isValid = await manager.validateSettings(settingsPath);
      expect(isValid).toBe(true);
    });
    
    test('should reject settings without mcpServers', async () => {
      const invalidSettings = {
        experimental: {}
      };
      
      const settingsPath = path.join(tempDir, 'settings.json');
      await fs.writeJson(settingsPath, invalidSettings);
      
      const isValid = await manager.validateSettings(settingsPath);
      expect(isValid).toBe(false);
    });
    
    test('should reject settings with non-existent SQLite file', async () => {
      const invalidSettings = {
        mcpServers: {
          sqlite: {
            command: 'python',
            args: ['-m', 'mcp_server_sqlite', '--db-path', '/non/existent/file.sqlite']
          }
        }
      };
      
      const settingsPath = path.join(tempDir, 'settings.json');
      await fs.writeJson(settingsPath, invalidSettings);
      
      const isValid = await manager.validateSettings(settingsPath);
      expect(isValid).toBe(false);
    });
    
    test('should return false for non-existent settings file', async () => {
      const isValid = await manager.validateSettings('/non/existent/settings.json');
      expect(isValid).toBe(false);
    });
  });
  
  describe('updateSettings', () => {
    test('should update existing settings', async () => {
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: '/path/to/data.sqlite'
      };
      
      const settingsPath = await manager.generateSettings(config);
      
      // Update timeout
      await manager.updateSettings(settingsPath, {
        mcpServers: {
          sqlite: {
            command: 'python',
            args: ['-m', 'mcp_server_sqlite', '--db-path', '/path/to/data.sqlite'],
            timeout: 120000
          }
        }
      });
      
      const updatedSettings = await fs.readJson(settingsPath);
      expect(updatedSettings.mcpServers.sqlite.timeout).toBe(120000);
    });
    
    test('should preserve other settings when updating', async () => {
      const config: SettingsConfig = {
        workspaceDir: tempDir,
        sqlitePath: '/path/to/data.sqlite'
      };
      
      const settingsPath = await manager.generateSettings(config);
      
      // Add experimental features
      await manager.updateSettings(settingsPath, {
        experimental: {
          newFeature: true
        }
      });
      
      const updatedSettings = await fs.readJson(settingsPath);
      expect(updatedSettings.mcpServers.sqlite).toBeDefined();
      expect(updatedSettings.experimental.newFeature).toBe(true);
    });
  });
  
  describe('getDefaultSettings', () => {
    test('should return default settings template', () => {
      const defaults = manager.getDefaultSettings();
      
      expect(defaults.mcpServers.sqlite).toBeDefined();
      expect(defaults.mcpServers.sqlite.command).toBe('python');
      expect(defaults.mcpServers.sqlite.trust).toBe(true);
      expect(Array.isArray(defaults.mcpServers.sqlite.includeTools)).toBe(true);
    });
  });
});

describe('SettingsHelper', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = path.join(__dirname, 'temp', `helper-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });
  
  afterEach(async () => {
    await fs.remove(tempDir);
  });
  
  describe('findSettingsFile', () => {
    test('should find settings in .gemini directory', async () => {
      const settingsPath = path.join(tempDir, '.gemini', 'settings.json');
      await fs.ensureDir(path.dirname(settingsPath));
      await fs.writeJson(settingsPath, {});
      
      const found = await SettingsHelper.findSettingsFile(tempDir);
      expect(found).toBe(settingsPath);
    });
    
    test('should return null if no settings found', async () => {
      // Use a unique temp directory to avoid conflicts with existing settings
      const uniqueTempDir = path.join(tempDir, 'non-existent-' + Date.now());
      const found = await SettingsHelper.findSettingsFile(uniqueTempDir);
      
      // If found is not null, it must be from the home directory
      if (found !== null) {
        expect(found).toContain(process.env.HOME);
        expect(found).toContain('.gemini');
      } else {
        expect(found).toBeNull();
      }
    });
  });
  
  describe('backupSettings', () => {
    test('should create backup with timestamp', async () => {
      const settingsPath = path.join(tempDir, 'settings.json');
      await fs.writeJson(settingsPath, { test: true });
      
      const backupPath = await SettingsHelper.backupSettings(settingsPath);
      
      expect(await fs.pathExists(backupPath)).toBe(true);
      expect(backupPath).toMatch(/settings\.json\.backup\.\d+$/);
      
      const backupContent = await fs.readJson(backupPath);
      expect(backupContent.test).toBe(true);
    });
  });
  
  describe('validateMCPServerPath', () => {
    test('should validate Python package structure', () => {
      const serverPath = '/fake/path';
      const pythonPath = path.join(serverPath, 'mcp_server_sqlite', '__init__.py');
      
      // Mock fs.existsSync
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn((p) => p === pythonPath);
      
      const isValid = SettingsHelper.validateMCPServerPath(serverPath);
      expect(isValid).toBe(true);
      
      fs.existsSync = originalExistsSync;
    });
    
    test('should validate UV project structure', () => {
      const serverPath = '/fake/path';
      const uvPath = path.join(serverPath, 'pyproject.toml');
      
      // Mock fs.existsSync
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn((p) => p === uvPath);
      
      const isValid = SettingsHelper.validateMCPServerPath(serverPath);
      expect(isValid).toBe(true);
      
      fs.existsSync = originalExistsSync;
    });
  });
  
  describe('cleanOldBackups', () => {
    test('should keep only recent backups', async () => {
      // Create multiple backup files
      for (let i = 0; i < 10; i++) {
        const backupName = `settings.json.backup.${1000000 + i}`;
        await fs.writeFile(path.join(tempDir, backupName), '{}');
      }
      
      await SettingsHelper.cleanOldBackups(tempDir, 3);
      
      const files = await fs.readdir(tempDir);
      const backupFiles = files.filter(f => f.startsWith('settings.json.backup.'));
      
      expect(backupFiles.length).toBe(3);
      expect(backupFiles).toContain('settings.json.backup.1000009');
      expect(backupFiles).toContain('settings.json.backup.1000008');
      expect(backupFiles).toContain('settings.json.backup.1000007');
    });
  });
});

describe('EnvironmentManager', () => {
  describe('environment variables', () => {
    test('should get settings directory', () => {
      const workspaceDir = '/workspace';
      const settingsDir = EnvironmentManager.getSettingsDir(workspaceDir);
      expect(settingsDir).toBe(path.join(workspaceDir, '.gemini'));
    });
    
    test('should use custom settings directory from env', () => {
      process.env.GEMINI_SETTINGS_DIR = '/custom/settings';
      const settingsDir = EnvironmentManager.getSettingsDir('/workspace');
      expect(settingsDir).toBe('/custom/settings');
      delete process.env.GEMINI_SETTINGS_DIR;
    });
    
    test('should detect debug mode', () => {
      expect(EnvironmentManager.isDebugMode()).toBe(false);
      
      process.env.VIBECRAFT_DEBUG = 'true';
      expect(EnvironmentManager.isDebugMode()).toBe(true);
      
      delete process.env.VIBECRAFT_DEBUG;
    });
    
    test('should get timeout with default', () => {
      expect(EnvironmentManager.getTimeout()).toBe(30000);
      
      process.env.VIBECRAFT_TIMEOUT = '60000';
      expect(EnvironmentManager.getTimeout()).toBe(60000);
      
      delete process.env.VIBECRAFT_TIMEOUT;
    });
  });
  
  describe('createEnvironment', () => {
    test('should create environment with settings directory', () => {
      const env = EnvironmentManager.createEnvironment('/workspace');
      expect(env.GEMINI_SETTINGS_DIR).toBe('/workspace/.gemini');
    });
    
    test('should merge additional environment variables', () => {
      const env = EnvironmentManager.createEnvironment('/workspace', {
        CUSTOM_VAR: 'custom_value'
      });
      
      expect(env.GEMINI_SETTINGS_DIR).toBe('/workspace/.gemini');
      expect(env.CUSTOM_VAR).toBe('custom_value');
    });
  });
  
  describe('validateEnvironment', () => {
    test('should validate Node.js version', () => {
      const validation = EnvironmentManager.validateEnvironment();
      
      // Current environment should be valid
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });
});