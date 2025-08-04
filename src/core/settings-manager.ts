import path from 'path';
import fs from 'fs-extra';

/**
 * Interface for Settings Manager operations
 */
export interface ISettingsManager {
  generateSettings(config: SettingsConfig): Promise<string>;
  validateSettings(settingsPath: string): Promise<boolean>;
  updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void>;
  getDefaultSettings(): Settings;
}

/**
 * Configuration for generating settings
 */
export interface SettingsConfig {
  workspaceDir: string;
  sqlitePath: string;
  mcpServerPath?: string;
  timeout?: number;
  trust?: boolean;
}

/**
 * Gemini CLI settings structure
 */
export interface Settings {
  mcpServers: {
    [key: string]: MCPServerConfig;
  };
  experimental?: {
    [key: string]: any;
  };
}

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  command: string;
  args: string[];
  timeout?: number;
  trust?: boolean;
  includeTools?: string[];
  env?: Record<string, string>;
}

/**
 * Manages settings.json generation and manipulation for Gemini CLI
 */
export class SettingsManager implements ISettingsManager {
  private readonly defaultTimeout = 30000;
  private readonly defaultMCPServerPath = process.env.MCP_SERVER_PATH || '/usr/local/lib/mcp-server-sqlite';
  
  /**
   * Generate settings.json file for Gemini CLI
   */
  async generateSettings(config: SettingsConfig): Promise<string> {
    // Create settings directory
    const settingsDir = path.join(config.workspaceDir, '.gemini');
    await fs.ensureDir(settingsDir);
    
    // Create settings object
    const settings = this.createSettings(config);
    
    // Settings file path
    const settingsPath = path.join(settingsDir, 'settings.json');
    
    // Save settings file
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    
    return settingsPath;
  }
  
  /**
   * Create settings object from configuration
   */
  private createSettings(config: SettingsConfig): Settings {
    const absoluteSqlitePath = path.resolve(config.sqlitePath);
    const mcpServerPath = config.mcpServerPath || this.defaultMCPServerPath;
    
    // Determine MCP server execution method
    const { command, args } = this.determineMCPCommand(mcpServerPath, absoluteSqlitePath);
    
    const settings: Settings = {
      mcpServers: {
        sqlite: {
          command,
          args,
          timeout: config.timeout || this.defaultTimeout,
          trust: config.trust !== false, // default true
          includeTools: [
            'read_query',
            'write_query',
            'list_tables',
            'describe_table',
            'list_schemas',
            'describe_schema'
          ]
        }
      }
    };
    
    // Add experimental features if enabled
    if (process.env.GEMINI_EXPERIMENTAL_FEATURES) {
      settings.experimental = {
        asyncExecution: true,
        parallelTools: true
      };
    }
    
    return settings;
  }
  
  /**
   * Determine MCP server command based on installation type
   */
  private determineMCPCommand(mcpServerPath: string, sqlitePath: string): {
    command: string;
    args: string[];
  } {
    // Check for UV-based execution
    if (fs.existsSync(path.join(mcpServerPath, 'pyproject.toml'))) {
      return {
        command: 'uv',
        args: [
          '--directory',
          mcpServerPath,
          'run',
          'mcp-server-sqlite',
          '--db-path',
          sqlitePath
        ]
      };
    }
    
    // Check if we should use UV for Python packages
    const pythonCommand = this.findPythonCommand();
    
    if (pythonCommand === 'uvx') {
      // UV executable mode
      return {
        command: 'uvx',
        args: [
          'mcp-server-sqlite',
          '--db-path',
          sqlitePath
        ]
      };
    }
    
    // Python module execution
    return {
      command: pythonCommand,
      args: [
        '-m',
        'mcp_server_sqlite',
        '--db-path',
        sqlitePath
      ]
    };
  }
  
  /**
   * Validate settings file
   */
  async validateSettings(settingsPath: string): Promise<boolean> {
    try {
      // Check file existence
      if (!await fs.pathExists(settingsPath)) {
        return false;
      }
      
      // Check JSON parsability
      const content = await fs.readJson(settingsPath);
      
      // Check required fields
      if (!content.mcpServers || !content.mcpServers.sqlite) {
        return false;
      }
      
      const sqliteConfig = content.mcpServers.sqlite;
      if (!sqliteConfig.command || !Array.isArray(sqliteConfig.args)) {
        return false;
      }
      
      // Check SQLite file path
      const dbPathIndex = sqliteConfig.args.indexOf('--db-path');
      if (dbPathIndex === -1 || dbPathIndex === sqliteConfig.args.length - 1) {
        return false;
      }
      
      const dbPath = sqliteConfig.args[dbPathIndex + 1];
      if (!await fs.pathExists(dbPath)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Update existing settings file
   */
  async updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void> {
    // Read current settings
    const currentSettings = await fs.readJson(settingsPath);
    
    // Merge settings
    const updatedSettings = this.mergeSettings(currentSettings, updates);
    
    // Save settings
    await fs.writeJson(settingsPath, updatedSettings, { spaces: 2 });
  }
  
  /**
   * Merge settings objects
   */
  private mergeSettings(current: Settings, updates: Partial<Settings>): Settings {
    return {
      ...current,
      ...updates,
      mcpServers: {
        ...current.mcpServers,
        ...(updates.mcpServers || {})
      },
      experimental: {
        ...(current.experimental || {}),
        ...(updates.experimental || {})
      }
    };
  }
  
  /**
   * Get default settings template
   */
  getDefaultSettings(): Settings {
    // Try to find python3 or python in the system
    const pythonCommand = this.findPythonCommand();
    
    // Different args based on command type
    let args: string[];
    if (pythonCommand === 'uvx') {
      // UV executable mode
      args = ['mcp-server-sqlite', '--db-path', ''];
    } else {
      // Python module mode
      args = ['-m', 'mcp_server_sqlite', '--db-path', ''];
    }
    
    return {
      mcpServers: {
        sqlite: {
          command: pythonCommand,
          args: args,
          timeout: this.defaultTimeout,
          trust: true,
          includeTools: [
            'read_query',
            'write_query',
            'list_tables',
            'describe_table',
            'list_schemas',
            'describe_schema'
          ]
        }
      }
    };
  }
  
  /**
   * Find available Python command
   */
  private findPythonCommand(): string {
    const { execSync } = require('child_process');
    
    // First, check if UV is available for running Python packages
    try {
      execSync('uv --version', { stdio: 'pipe' });
      // UV is available, use it to run the MCP server
      return 'uvx';
    } catch {
      // UV not found, try Python directly
    }
    
    const possiblePaths = [
      '/opt/homebrew/bin/python3',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      'python3',
      'python'
    ];
    
    for (const pythonPath of possiblePaths) {
      try {
        execSync(`${pythonPath} --version`, { stdio: 'pipe' });
        return pythonPath;
      } catch {
        // Try next path
      }
    }
    
    // Default fallback
    return 'python3';
  }
}