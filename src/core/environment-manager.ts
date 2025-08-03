import path from 'path';

/**
 * Manages environment variables and configuration for VibeCraft Agent
 */
export class EnvironmentManager {
  private static readonly ENV_VARS = {
    GEMINI_SETTINGS_DIR: 'GEMINI_SETTINGS_DIR',
    MCP_SERVER_PATH: 'MCP_SERVER_PATH',
    VIBECRAFT_DEBUG: 'VIBECRAFT_DEBUG',
    VIBECRAFT_TIMEOUT: 'VIBECRAFT_TIMEOUT',
    VIBECRAFT_LOG_LEVEL: 'VIBECRAFT_LOG_LEVEL',
    GEMINI_EXPERIMENTAL_FEATURES: 'GEMINI_EXPERIMENTAL_FEATURES'
  };
  
  /**
   * Get Gemini settings directory
   */
  static getSettingsDir(workspaceDir: string): string {
    return process.env[this.ENV_VARS.GEMINI_SETTINGS_DIR] || 
           path.join(workspaceDir, '.gemini');
  }
  
  /**
   * Get MCP server installation path
   */
  static getMCPServerPath(): string | undefined {
    return process.env[this.ENV_VARS.MCP_SERVER_PATH];
  }
  
  /**
   * Check if debug mode is enabled
   */
  static isDebugMode(): boolean {
    return process.env[this.ENV_VARS.VIBECRAFT_DEBUG] === 'true';
  }
  
  /**
   * Get configured timeout value
   */
  static getTimeout(): number {
    const timeout = process.env[this.ENV_VARS.VIBECRAFT_TIMEOUT];
    return timeout ? parseInt(timeout, 10) : 30000;
  }
  
  /**
   * Get log level
   */
  static getLogLevel(): string {
    return process.env[this.ENV_VARS.VIBECRAFT_LOG_LEVEL] || 'info';
  }
  
  /**
   * Check if experimental features are enabled
   */
  static hasExperimentalFeatures(): boolean {
    return process.env[this.ENV_VARS.GEMINI_EXPERIMENTAL_FEATURES] === 'true';
  }
  
  /**
   * Create environment for child processes
   */
  static createEnvironment(workspaceDir: string, additionalEnv?: Record<string, string>): NodeJS.ProcessEnv {
    return {
      ...process.env,
      [this.ENV_VARS.GEMINI_SETTINGS_DIR]: path.join(workspaceDir, '.gemini'),
      ...additionalEnv
    };
  }
  
  /**
   * Load environment from .env file if exists
   */
  static async loadEnvFile(envPath: string = '.env'): Promise<void> {
    try {
      const fs = await import('fs-extra');
      if (await fs.pathExists(envPath)) {
        const content = await fs.readFile(envPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        }
      }
    } catch (error) {
      // Silently ignore .env loading errors
    }
  }
  
  /**
   * Get all VibeCraft-related environment variables
   */
  static getVibeCraftEnv(): Record<string, string | undefined> {
    const env: Record<string, string | undefined> = {};
    
    for (const [key, envVar] of Object.entries(this.ENV_VARS)) {
      env[key] = process.env[envVar];
    }
    
    return env;
  }
  
  /**
   * Validate environment setup
   */
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for Python in a more reliable way
    const pythonCommands = ['python3', 'python', 'py'];
    const hasPython = pythonCommands.some(cmd => {
      try {
        const { execSync } = require('child_process');
        execSync(`${cmd} --version`, { stdio: 'ignore' });
        return true;
      } catch (e) {
        return false;
      }
    });
    
    if (!hasPython) {
      errors.push('Python not found. MCP server requires Python 3.8+');
    }
    
    // Check for Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1), 10);
    if (majorVersion < 16) {
      errors.push(`Node.js version ${nodeVersion} detected. VibeCraft requires Node.js 16+`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create debug information
   */
  static getDebugInfo(): Record<string, any> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      vibecraftEnv: this.getVibeCraftEnv(),
      paths: {
        mcp: this.getMCPServerPath(),
        settings: process.env[this.ENV_VARS.GEMINI_SETTINGS_DIR]
      },
      features: {
        debug: this.isDebugMode(),
        experimental: this.hasExperimentalFeatures()
      }
    };
  }
}