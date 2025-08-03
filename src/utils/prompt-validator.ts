/**
 * Validation result for prompts
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: PromptStats;
}

/**
 * Statistics about the prompt
 */
export interface PromptStats {
  characterCount: number;
  wordCount: number;
  estimatedTokens: number;
  sectionCount: number;
}

/**
 * Validates prompts for completeness and potential issues
 */
export class PromptValidator {
  private static readonly MAX_PROMPT_LENGTH = 50000;
  private static readonly MAX_TOKEN_ESTIMATE = 12000;
  
  /**
   * Validate a complete prompt
   */
  static validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if prompt is empty
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt is empty');
      return { valid: false, errors, warnings };
    }
    
    // Check required sections
    const requiredSections = [
      'Core Rules',
      'Technical Stack',
      'Database Information',
      'User Requirements'
    ];
    
    for (const section of requiredSections) {
      if (!prompt.includes(section)) {
        errors.push(`Missing required section: ${section}`);
      }
    }
    
    // Check prompt length
    if (prompt.length > this.MAX_PROMPT_LENGTH) {
      warnings.push(`Prompt is very long (${prompt.length} characters). Consider optimizing.`);
    }
    
    // Estimate tokens
    const stats = this.calculateStats(prompt);
    if (stats.estimatedTokens > this.MAX_TOKEN_ESTIMATE) {
      warnings.push(`Estimated token count (${stats.estimatedTokens}) may exceed model limits`);
    }
    
    // Check for SQL injection patterns
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i,
      /;\s*--/,
      /UNION\s+SELECT.*FROM\s+information_schema/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(prompt)) {
        warnings.push('Prompt contains potentially dangerous SQL patterns');
        break;
      }
    }
    
    // Check for balanced code blocks
    const codeBlockCount = (prompt.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      warnings.push('Unbalanced code blocks detected');
    }
    
    // Check schema information
    if (!prompt.includes('Table:') || !prompt.includes('Columns:')) {
      warnings.push('Schema information may be incomplete');
    }
    
    // Check for template content
    if (!prompt.includes('Visualization Template Instructions:')) {
      warnings.push('Template instructions may be missing');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }
  
  /**
   * Validate prompt components before building
   */
  static validateComponents(components: {
    systemPrompt?: string;
    templateContent?: string;
    userPrompt?: string;
    schemaInfo?: any;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check system prompt
    if (!components.systemPrompt || components.systemPrompt.trim().length === 0) {
      warnings.push('No custom system prompt provided, will use default');
    }
    
    // Check template content
    if (!components.templateContent || components.templateContent.trim().length === 0) {
      errors.push('Template content is required');
    }
    
    // Check user prompt
    if (!components.userPrompt || components.userPrompt.trim().length === 0) {
      errors.push('User prompt is required');
    } else if (components.userPrompt.length < 10) {
      warnings.push('User prompt is very short, consider providing more details');
    }
    
    // Check schema info
    if (!components.schemaInfo) {
      errors.push('Schema information is required');
    } else {
      if (!components.schemaInfo.tables || components.schemaInfo.tables.length === 0) {
        errors.push('No tables found in schema');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Calculate statistics about the prompt
   */
  private static calculateStats(prompt: string): PromptStats {
    const characterCount = prompt.length;
    const words = prompt.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Estimate tokens (rough approximation)
    // Average: 1 token ≈ 4 characters or 0.75 words
    const estimatedTokens = Math.ceil(Math.max(
      characterCount / 4,
      wordCount * 0.75
    ));
    
    const sections = prompt.split(/\n#{1,3}\s+/).length - 1;
    
    return {
      characterCount,
      wordCount,
      estimatedTokens,
      sectionCount: sections
    };
  }
  
  /**
   * Check if prompt is optimized
   */
  static isOptimized(prompt: string): boolean {
    const stats = this.calculateStats(prompt);
    
    // Check if prompt is within reasonable limits
    return (
      stats.characterCount <= 30000 &&
      stats.estimatedTokens <= 8000 &&
      stats.wordCount <= 5000
    );
  }
  
  /**
   * Get optimization suggestions
   */
  static getOptimizationSuggestions(prompt: string): string[] {
    const suggestions: string[] = [];
    const stats = this.calculateStats(prompt);
    
    if (stats.estimatedTokens > 8000) {
      suggestions.push('Consider reducing prompt size by removing redundant sections');
    }
    
    // Check for repeated content
    const lines = prompt.split('\n');
    const uniqueLines = new Set(lines);
    if (lines.length - uniqueLines.size > 10) {
      suggestions.push('Remove duplicate lines to reduce prompt size');
    }
    
    // Check for overly verbose sections
    const sections = prompt.split(/\n#{1,3}\s+/);
    for (const section of sections) {
      if (section.length > 5000) {
        suggestions.push('Some sections are very long, consider summarizing');
        break;
      }
    }
    
    // Check sample data size
    const sampleDataMatches = prompt.match(/Sample Data:[\s\S]*?```json([\s\S]*?)```/g) || [];
    for (const match of sampleDataMatches) {
      if (match.length > 1000) {
        suggestions.push('Sample data is large, consider showing fewer examples');
        break;
      }
    }
    
    return suggestions;
  }
}