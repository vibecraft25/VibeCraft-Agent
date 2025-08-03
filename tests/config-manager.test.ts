import { ConfigManager, VibeCraftConfig } from '../src/utils/config-manager';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  const testConfigPath = path.join(process.cwd(), '.vibecraftrc.json');
  const globalConfigPath = path.join(os.homedir(), '.vibecraftrc.json');
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    originalEnv = { ...process.env };
    ConfigManager.clearCache();
    
    // Clean up any existing config files
    if (fs.existsSync(testConfigPath)) {
      fs.removeSync(testConfigPath);
    }
  });
  
  afterEach(() => {
    process.env = originalEnv;
    
    // Clean up test config files
    if (fs.existsSync(testConfigPath)) {
      fs.removeSync(testConfigPath);
    }
  });
  
  describe('loadConfig', () => {
    test('should load default config', async () => {
      const config = await ConfigManager.loadConfig();
      
      expect(config.defaultOutputDir).toBe('./output');
      expect(config.defaultTimeout).toBe(300000);
      expect(config.logLevel).toBe('info');
      expect(config.telemetry).toBe(false);
    });
    
    test('should load local config', async () => {
      const localConfig = {
        defaultOutputDir: './custom-output',
        logLevel: 'debug'
      };
      
      await fs.writeJson(testConfigPath, localConfig);
      
      const config = await ConfigManager.loadConfig();
      
      expect(config.defaultOutputDir).toBe('./custom-output');
      expect(config.logLevel).toBe('debug');
      expect(config.defaultTimeout).toBe(300000); // From default
    });
    
    test('should load environment variables', async () => {
      process.env.VIBECRAFT_OUTPUT_DIR = '/env/output';
      process.env.VIBECRAFT_TIMEOUT = '600000';
      process.env.VIBECRAFT_LOG_LEVEL = 'trace';
      process.env.MCP_SERVER_PATH = '/path/to/mcp';
      process.env.VIBECRAFT_TELEMETRY = 'true';
      
      const config = await ConfigManager.loadConfig();
      
      expect(config.defaultOutputDir).toBe('/env/output');
      expect(config.defaultTimeout).toBe(600000);
      expect(config.logLevel).toBe('trace');
      expect(config.mcpServerPath).toBe('/path/to/mcp');
      expect(config.telemetry).toBe(true);
    });
    
    test('should merge configs with correct precedence', async () => {
      // Local config
      await fs.writeJson(testConfigPath, {
        defaultOutputDir: './local-output',
        logLevel: 'warn'
      });
      
      // Environment variable (highest priority)
      process.env.VIBECRAFT_LOG_LEVEL = 'error';
      
      const config = await ConfigManager.loadConfig();
      
      expect(config.defaultOutputDir).toBe('./local-output'); // From local
      expect(config.logLevel).toBe('error'); // From env (overrides local)
      expect(config.defaultTimeout).toBe(300000); // From default
    });
    
    test('should cache config', async () => {
      const config1 = await ConfigManager.loadConfig();
      
      // Change env variable
      process.env.VIBECRAFT_LOG_LEVEL = 'changed';
      
      // Should return cached config
      const config2 = await ConfigManager.loadConfig();
      expect(config2).toEqual(config1);
      
      // Force reload
      const config3 = await ConfigManager.loadConfig(true);
      expect(config3.logLevel).toBe('changed');
    });
  });
  
  describe('saveConfig', () => {
    test('should save local config', async () => {
      const config = {
        defaultOutputDir: './saved-output',
        logLevel: 'debug'
      };
      
      await ConfigManager.saveConfig(config);
      
      const savedConfig = await fs.readJson(testConfigPath);
      expect(savedConfig).toEqual(config);
    });
    
    test('should merge with existing config', async () => {
      // Existing config
      await fs.writeJson(testConfigPath, {
        defaultOutputDir: './existing',
        logLevel: 'info',
        telemetry: true
      });
      
      // Save partial update
      await ConfigManager.saveConfig({
        logLevel: 'debug'
      });
      
      const savedConfig = await fs.readJson(testConfigPath);
      expect(savedConfig).toEqual({
        defaultOutputDir: './existing',
        logLevel: 'debug',
        telemetry: true
      });
    });
    
    test('should invalidate cache after save', async () => {
      await ConfigManager.loadConfig(); // Cache config
      
      await ConfigManager.saveConfig({
        logLevel: 'trace'
      });
      
      const config = await ConfigManager.loadConfig();
      expect(config.logLevel).toBe('trace');
    });
  });
  
  describe('deleteConfig', () => {
    test('should delete config file', async () => {
      await fs.writeJson(testConfigPath, { test: true });
      
      await ConfigManager.deleteConfig();
      
      const exists = await fs.pathExists(testConfigPath);
      expect(exists).toBe(false);
    });
    
    test('should not throw if config does not exist', async () => {
      await expect(ConfigManager.deleteConfig()).resolves.not.toThrow();
    });
  });
  
  describe('validateConfig', () => {
    test('should validate valid config', async () => {
      const config: Partial<VibeCraftConfig> = {
        defaultTimeout: 60000,
        logLevel: 'debug',
        maxRetries: 5,
        retryDelay: 1000
      };
      
      const result = await ConfigManager.validateConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should detect invalid timeout', async () => {
      const config = {
        defaultTimeout: -1000
      };
      
      const result = await ConfigManager.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('defaultTimeout must be a positive number');
    });
    
    test('should detect invalid log level', async () => {
      const config = {
        logLevel: 'invalid'
      };
      
      const result = await ConfigManager.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('logLevel must be one of:');
    });
    
    test('should detect multiple errors', async () => {
      const config = {
        defaultTimeout: 0,
        logLevel: 'invalid',
        maxRetries: -1
      };
      
      const result = await ConfigManager.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
  
  describe('hasConfig', () => {
    test('should check config existence', async () => {
      expect(await ConfigManager.hasConfig()).toBe(false);
      
      await fs.writeJson(testConfigPath, {});
      
      expect(await ConfigManager.hasConfig()).toBe(true);
    });
  });
  
  describe('exportConfig and importConfig', () => {
    test('should export and import config', async () => {
      const exportPath = path.join(__dirname, 'export-config.json');
      
      // Set some config
      await ConfigManager.saveConfig({
        defaultOutputDir: './export-test',
        logLevel: 'debug'
      });
      
      // Export
      await ConfigManager.exportConfig(exportPath);
      
      // Clear and import
      await ConfigManager.deleteConfig();
      await ConfigManager.importConfig(exportPath);
      
      const config = await ConfigManager.loadConfig(true);
      expect(config.defaultOutputDir).toBe('./export-test');
      expect(config.logLevel).toBe('debug');
      
      // Clean up
      await fs.remove(exportPath);
    });
    
    test('should validate on import', async () => {
      const invalidConfigPath = path.join(__dirname, 'invalid-config.json');
      
      await fs.writeJson(invalidConfigPath, {
        defaultTimeout: -1000
      });
      
      await expect(ConfigManager.importConfig(invalidConfigPath))
        .rejects.toThrow('Invalid config:');
      
      // Clean up
      await fs.remove(invalidConfigPath);
    });
  });
});