import path from 'path';
import fs from 'fs-extra';

/**
 * Helper utilities for settings management
 */
export class SettingsHelper {
  /**
   * Find settings file in various locations
   */
  static async findSettingsFile(startDir: string): Promise<string | null> {
    const possiblePaths = [
      path.join(startDir, '.gemini', 'settings.json'),
      path.join(startDir, 'settings.json')
    ];
    
    // Only check home directory if it's not the same as startDir
    const homeSettingsPath = path.join(process.env.HOME || '', '.gemini', 'settings.json');
    if (!possiblePaths.includes(homeSettingsPath)) {
      possiblePaths.push(homeSettingsPath);
    }
    
    for (const settingsPath of possiblePaths) {
      if (await fs.pathExists(settingsPath)) {
        return settingsPath;
      }
    }
    
    return null;
  }
  
  /**
   * Create backup of settings file
   */
  static async backupSettings(settingsPath: string): Promise<string> {
    const backupPath = `${settingsPath}.backup.${Date.now()}`;
    await fs.copy(settingsPath, backupPath);
    return backupPath;
  }
  
  /**
   * Validate MCP server installation
   */
  static validateMCPServerPath(serverPath: string): boolean {
    // Python package check
    const pythonPackage = path.join(serverPath, 'mcp_server_sqlite', '__init__.py');
    if (fs.existsSync(pythonPackage)) {
      return true;
    }
    
    // UV project check
    const uvProject = path.join(serverPath, 'pyproject.toml');
    if (fs.existsSync(uvProject)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get MCP server version
   */
  static async getMCPServerVersion(serverPath: string): Promise<string | null> {
    try {
      // Check pyproject.toml for UV projects
      const pyprojectPath = path.join(serverPath, 'pyproject.toml');
      if (await fs.pathExists(pyprojectPath)) {
        const content = await fs.readFile(pyprojectPath, 'utf8');
        const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
        if (versionMatch) {
          return versionMatch[1];
        }
      }
      
      // Check setup.py for traditional packages
      const setupPath = path.join(serverPath, 'setup.py');
      if (await fs.pathExists(setupPath)) {
        const content = await fs.readFile(setupPath, 'utf8');
        const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
        if (versionMatch) {
          return versionMatch[1];
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if MCP server is installed globally via pip
   */
  static async isMCPServerGloballyInstalled(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('pip show mcp-server-sqlite');
      return stdout.includes('Name: mcp-server-sqlite');
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get recommended MCP server path
   */
  static async getRecommendedMCPServerPath(): Promise<string | null> {
    // Check environment variable first
    if (process.env.MCP_SERVER_PATH) {
      if (this.validateMCPServerPath(process.env.MCP_SERVER_PATH)) {
        return process.env.MCP_SERVER_PATH;
      }
    }
    
    // Check common installation paths
    const commonPaths = [
      '/usr/local/lib/mcp-server-sqlite',
      path.join(process.env.HOME || '', '.local', 'lib', 'mcp-server-sqlite'),
      path.join(process.env.HOME || '', 'mcp-server-sqlite'),
      '/opt/mcp-server-sqlite'
    ];
    
    for (const mcpPath of commonPaths) {
      if (this.validateMCPServerPath(mcpPath)) {
        return mcpPath;
      }
    }
    
    // Check if globally installed
    if (await this.isMCPServerGloballyInstalled()) {
      return 'global'; // Special flag for global installation
    }
    
    return null;
  }
  
  /**
   * Clean old backup files
   */
  static async cleanOldBackups(settingsDir: string, keepCount: number = 5): Promise<void> {
    const files = await fs.readdir(settingsDir);
    const backupFiles = files
      .filter(f => f.startsWith('settings.json.backup.'))
      .map(f => ({
        name: f,
        path: path.join(settingsDir, f),
        timestamp: parseInt(f.split('.').pop() || '0', 10)
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only the most recent backups
    const filesToDelete = backupFiles.slice(keepCount);
    for (const file of filesToDelete) {
      await fs.remove(file.path);
    }
  }
  
  /**
   * Merge environment variables for MCP server
   */
  static createMCPEnvironment(additionalEnv?: Record<string, string>): Record<string, string> {
    return {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      MCP_LOG_LEVEL: process.env.MCP_LOG_LEVEL || 'info',
      ...additionalEnv
    };
  }
}