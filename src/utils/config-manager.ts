import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface VibeCraftConfig {
  defaultOutputDir: string;
  defaultTimeout: number;
  mcpServerPath?: string;
  geminiPath?: string;
  geminiModel?: string;
  logLevel: string;
  logFile?: string;
  telemetry: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class ConfigManager {
  private static CONFIG_FILE = '.vibecraftrc.json';
  private static GLOBAL_CONFIG_PATH = path.join(os.homedir(), this.CONFIG_FILE);
  private static cachedConfig: Partial<VibeCraftConfig> | null = null;
  
  static async loadConfig(forceReload: boolean = false): Promise<Partial<VibeCraftConfig>> {
    if (!forceReload && this.cachedConfig) {
      return this.cachedConfig;
    }
    
    const configs: Partial<VibeCraftConfig>[] = [];
    
    // 1. 기본 설정
    configs.push(this.getDefaultConfig());
    
    // 2. 전역 설정
    if (await fs.pathExists(this.GLOBAL_CONFIG_PATH)) {
      try {
        const globalConfig = await fs.readJson(this.GLOBAL_CONFIG_PATH);
        configs.push(globalConfig);
      } catch (error) {
        console.warn('Failed to load global config:', error);
      }
    }
    
    // 3. 로컬 설정
    const localConfigPath = path.join(process.cwd(), this.CONFIG_FILE);
    if (await fs.pathExists(localConfigPath)) {
      try {
        const localConfig = await fs.readJson(localConfigPath);
        configs.push(localConfig);
      } catch (error) {
        console.warn('Failed to load local config:', error);
      }
    }
    
    // 4. 환경 변수
    configs.push(this.getEnvConfig());
    
    // 설정 병합 (후순위가 우선)
    const mergedConfig = configs.reduce((merged, config) => ({ ...merged, ...config }), {});
    this.cachedConfig = mergedConfig;
    
    return mergedConfig;
  }
  
  static async saveConfig(
    config: Partial<VibeCraftConfig>, 
    global: boolean = false
  ): Promise<void> {
    const configPath = global ? this.GLOBAL_CONFIG_PATH : path.join(process.cwd(), this.CONFIG_FILE);
    
    // 기존 설정 읽기
    let existingConfig = {};
    if (await fs.pathExists(configPath)) {
      try {
        existingConfig = await fs.readJson(configPath);
      } catch {
        // 파일이 손상된 경우 무시
      }
    }
    
    // 병합 및 저장
    const updatedConfig = { ...existingConfig, ...config };
    
    // 디렉토리 확인
    await fs.ensureDir(path.dirname(configPath));
    
    // 저장
    await fs.writeJson(configPath, updatedConfig, { spaces: 2 });
    
    // 캐시 무효화
    this.cachedConfig = null;
  }
  
  static async deleteConfig(global: boolean = false): Promise<void> {
    const configPath = global ? this.GLOBAL_CONFIG_PATH : path.join(process.cwd(), this.CONFIG_FILE);
    
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath);
      this.cachedConfig = null;
    }
  }
  
  static async getConfigPath(global: boolean = false): Promise<string> {
    return global ? this.GLOBAL_CONFIG_PATH : path.join(process.cwd(), this.CONFIG_FILE);
  }
  
  static async hasConfig(global: boolean = false): Promise<boolean> {
    const configPath = await this.getConfigPath(global);
    return await fs.pathExists(configPath);
  }
  
  private static getDefaultConfig(): VibeCraftConfig {
    return {
      defaultOutputDir: './output',
      defaultTimeout: 300000, // 5분
      geminiModel: 'gemini-2.5-pro',
      logLevel: 'info',
      telemetry: false,
      maxRetries: 3,
      retryDelay: 1000
    };
  }
  
  private static getEnvConfig(): Partial<VibeCraftConfig> {
    const config: Partial<VibeCraftConfig> = {};
    
    if (process.env.VIBECRAFT_OUTPUT_DIR) {
      config.defaultOutputDir = process.env.VIBECRAFT_OUTPUT_DIR;
    }
    
    if (process.env.VIBECRAFT_TIMEOUT) {
      const timeout = parseInt(process.env.VIBECRAFT_TIMEOUT, 10);
      if (!isNaN(timeout) && timeout > 0) {
        config.defaultTimeout = timeout;
      }
    }
    
    if (process.env.MCP_SERVER_PATH) {
      config.mcpServerPath = process.env.MCP_SERVER_PATH;
    }
    
    if (process.env.GEMINI_PATH) {
      config.geminiPath = process.env.GEMINI_PATH;
    }
    
    if (process.env.GEMINI_MODEL) {
      config.geminiModel = process.env.GEMINI_MODEL;
    }
    
    if (process.env.VIBECRAFT_LOG_LEVEL) {
      config.logLevel = process.env.VIBECRAFT_LOG_LEVEL;
    }
    
    if (process.env.VIBECRAFT_LOG_FILE) {
      config.logFile = process.env.VIBECRAFT_LOG_FILE;
    }
    
    if (process.env.VIBECRAFT_TELEMETRY) {
      config.telemetry = process.env.VIBECRAFT_TELEMETRY.toLowerCase() === 'true';
    }
    
    if (process.env.VIBECRAFT_MAX_RETRIES) {
      const maxRetries = parseInt(process.env.VIBECRAFT_MAX_RETRIES, 10);
      if (!isNaN(maxRetries) && maxRetries >= 0) {
        config.maxRetries = maxRetries;
      }
    }
    
    if (process.env.VIBECRAFT_RETRY_DELAY) {
      const retryDelay = parseInt(process.env.VIBECRAFT_RETRY_DELAY, 10);
      if (!isNaN(retryDelay) && retryDelay >= 0) {
        config.retryDelay = retryDelay;
      }
    }
    
    return config;
  }
  
  static async validateConfig(config: Partial<VibeCraftConfig>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Timeout 검증
    if (config.defaultTimeout !== undefined) {
      if (typeof config.defaultTimeout !== 'number' || config.defaultTimeout <= 0) {
        errors.push('defaultTimeout must be a positive number');
      }
    }
    
    // Log level 검증
    if (config.logLevel !== undefined) {
      const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
      if (!validLevels.includes(config.logLevel.toLowerCase())) {
        errors.push(`logLevel must be one of: ${validLevels.join(', ')}`);
      }
    }
    
    // MCP server path 검증
    if (config.mcpServerPath !== undefined && config.mcpServerPath !== null) {
      if (typeof config.mcpServerPath !== 'string' || config.mcpServerPath.trim() === '') {
        errors.push('mcpServerPath must be a non-empty string');
      }
    }
    
    // Gemini path 검증
    if (config.geminiPath !== undefined && config.geminiPath !== null) {
      if (typeof config.geminiPath !== 'string' || config.geminiPath.trim() === '') {
        errors.push('geminiPath must be a non-empty string');
      }
    }
    
    // Retry 설정 검증
    if (config.maxRetries !== undefined) {
      if (typeof config.maxRetries !== 'number' || config.maxRetries < 0) {
        errors.push('maxRetries must be a non-negative number');
      }
    }
    
    if (config.retryDelay !== undefined) {
      if (typeof config.retryDelay !== 'number' || config.retryDelay < 0) {
        errors.push('retryDelay must be a non-negative number');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static async exportConfig(filePath: string): Promise<void> {
    const config = await this.loadConfig();
    await fs.writeJson(filePath, config, { spaces: 2 });
  }
  
  static async importConfig(filePath: string, global: boolean = false): Promise<void> {
    const config = await fs.readJson(filePath);
    const validation = await this.validateConfig(config);
    
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }
    
    await this.saveConfig(config, global);
  }
  
  static clearCache(): void {
    this.cachedConfig = null;
  }
}