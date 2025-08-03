import { SchemaInfo } from './schema-analyzer';
import { Template } from './template-engine';

/**
 * Interface for Prompt Builder operations
 */
export interface IPromptBuilder {
  buildPrompt(components: PromptComponents): string;
  optimizePrompt(prompt: string, context: OptimizationContext): string;
  getSystemPrompt(): string;
}

/**
 * Components needed to build a complete prompt
 */
export interface PromptComponents {
  systemPrompt: string;
  templateContent: string;
  userPrompt: string;
  schemaInfo: SchemaInfo;
  projectContext?: ProjectContext;
}

/**
 * Project-specific context information
 */
export interface ProjectContext {
  projectName: string;
  outputDir: string;
  additionalRequirements?: string[];
  constraints?: string[];
}

/**
 * Context for prompt optimization
 */
export interface OptimizationContext {
  maxTokens?: number;
  focusAreas?: string[];
  excludePatterns?: string[];
}

/**
 * Builds and optimizes prompts for Gemini CLI
 */
export class PromptBuilder implements IPromptBuilder {
  private readonly SYSTEM_PROMPT_TEMPLATE = `You are VibeCraft-viz, a specialized agent for creating data visualization React applications.

## Core Rules:
1. Always create a complete, runnable React application
2. Use sql.js for browser-based SQLite access
3. Include all necessary dependencies in package.json
4. Implement responsive design with Tailwind CSS
5. Add proper error handling and loading states
6. Create the application in the current directory

## Technical Stack:
- React 18.x with functional components and hooks
- TypeScript (if user requests or template specifies)
- Recharts/Chart.js for data visualizations
- sql.js for SQLite database operations
- Tailwind CSS for styling
- date-fns for date manipulation (if needed)

## Project Structure:
\`\`\`
├── package.json
├── public/
│   ├── index.html
│   └── data.sqlite
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── README.md
\`\`\`

## Data Access Pattern:
Always use the provided SQLite database through sql.js:
\`\`\`javascript
import initSqlJs from 'sql.js';

const loadDatabase = async () => {
  const sqlPromise = initSqlJs({
    locateFile: file => \`https://sql.js.org/dist/\${file}\`
  });
  const dataPromise = fetch('/data.sqlite').then(res => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  return new SQL.Database(new Uint8Array(buf));
};
\`\`\`

## Important Requirements:
- The SQLite file will be automatically copied to public/data.sqlite
- Always test SQL queries against the actual schema
- Include error boundaries for better error handling
- Add meaningful comments in complex logic
- Create a professional UI with good UX`;

  /**
   * Build complete prompt from components
   */
  buildPrompt(components: PromptComponents): string {
    // 1. Prepare sections
    const systemSection = components.systemPrompt || this.SYSTEM_PROMPT_TEMPLATE;
    const schemaSection = this.formatSchemaSection(components.schemaInfo);
    const templateSection = this.formatTemplateSection(components.templateContent);
    const userSection = this.formatUserSection(components.userPrompt, components.projectContext);
    const instructionsSection = this.generateInstructions(components.projectContext);
    
    // 2. Combine all sections
    const finalPrompt = `${systemSection}

## Database Information:
SQLite database location: /data.sqlite (will be copied to public/)
${schemaSection}

${templateSection}

## User Requirements:
${userSection}

${instructionsSection}

Please generate the complete React application code based on the above requirements.`;

    return finalPrompt.trim();
  }

  /**
   * Format schema information for the prompt
   */
  private formatSchemaSection(schemaInfo: SchemaInfo): string {
    let section = `### Database Schema:\n\n`;
    section += `Total Tables: ${schemaInfo.tables.length}\n`;
    section += `Tables: ${schemaInfo.tables.map(t => t.name).join(', ')}\n\n`;
    
    // Format each table
    for (const table of schemaInfo.tables) {
      section += `#### Table: ${table.name}\n`;
      section += `- Row Count: ${table.rowCount}\n`;
      section += `- Columns:\n`;
      
      for (const col of table.columns) {
        const attributes = [];
        if (col.isPrimaryKey) attributes.push('PRIMARY KEY');
        if (col.isForeignKey) attributes.push('FOREIGN KEY');
        if (!col.nullable) attributes.push('NOT NULL');
        
        const attrString = attributes.length > 0 ? ` [${attributes.join(', ')}]` : '';
        section += `  - ${col.name}: ${col.type}${attrString}\n`;
        
        // Add data distribution info if available
        if (col.dataDistribution) {
          const dist = col.dataDistribution;
          section += `    - Unique values: ${dist.uniqueValues}\n`;
          if (dist.nullCount > 0) {
            section += `    - Null count: ${dist.nullCount}\n`;
          }
          if (dist.minValue !== undefined && dist.maxValue !== undefined) {
            section += `    - Range: ${dist.minValue} to ${dist.maxValue}\n`;
          }
        }
      }
      
      // Add foreign key relationships
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        section += `- Foreign Keys:\n`;
        for (const fk of table.foreignKeys) {
          section += `  - ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
        }
      }
      
      // Add sample data
      if (table.sampleData && table.sampleData.length > 0) {
        section += `- Sample Data:\n\`\`\`json\n`;
        section += JSON.stringify(table.sampleData.slice(0, 2), null, 2);
        section += `\n\`\`\`\n`;
      }
      
      section += '\n';
    }
    
    // Add relationships summary
    if (schemaInfo.relationships && schemaInfo.relationships.length > 0) {
      section += `### Table Relationships:\n`;
      for (const rel of schemaInfo.relationships) {
        section += `- ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn} (${rel.type})\n`;
      }
    }
    
    return section;
  }

  /**
   * Format template-specific content
   */
  private formatTemplateSection(templateContent: string): string {
    return `## Visualization Template Instructions:\n${templateContent}`;
  }

  /**
   * Format user requirements section
   */
  private formatUserSection(userPrompt: string, context?: ProjectContext): string {
    let section = '';
    
    if (context?.projectName) {
      section += `Project Name: ${context.projectName}\n\n`;
    }
    
    section += userPrompt;
    
    if (context?.additionalRequirements && context.additionalRequirements.length > 0) {
      section += '\n\n### Additional Requirements:\n';
      section += context.additionalRequirements.map(req => `- ${req}`).join('\n');
    }
    
    if (context?.constraints && context.constraints.length > 0) {
      section += '\n\n### Constraints:\n';
      section += context.constraints.map(c => `- ${c}`).join('\n');
    }
    
    return section;
  }

  /**
   * Generate additional instructions
   */
  private generateInstructions(context?: ProjectContext): string {
    const instructions = [
      '## Implementation Instructions:',
      '',
      '1. **File Generation**:',
      '   - Generate all files in the current directory',
      '   - Create a complete, production-ready React application',
      '   - Include all necessary configuration files',
      '',
      '2. **Database Integration**:',
      '   - The SQLite file is already available and will be copied to public/',
      '   - Use sql.js to query the database in the browser',
      '   - Implement proper error handling for database operations',
      '',
      '3. **UI/UX Requirements**:',
      '   - Create a professional, modern interface',
      '   - Ensure responsive design for all screen sizes',
      '   - Add loading states and error messages',
      '   - Use Tailwind CSS for consistent styling',
      '',
      '4. **Code Quality**:',
      '   - Use React best practices and hooks',
      '   - Add TypeScript if specified in the template',
      '   - Include helpful comments for complex logic',
      '   - Ensure the code is maintainable and scalable'
    ];
    
    if (context?.outputDir) {
      instructions.push('', `5. **Output Directory**: ${context.outputDir}`);
    }
    
    return instructions.join('\n');
  }

  /**
   * Optimize prompt based on context
   */
  optimizePrompt(prompt: string, context: OptimizationContext): string {
    let optimized = prompt;
    
    // Apply token limit if specified
    if (context.maxTokens) {
      optimized = this.truncateToTokenLimit(optimized, context.maxTokens);
    }
    
    // Emphasize focus areas
    if (context.focusAreas && context.focusAreas.length > 0) {
      optimized = this.emphasizeFocusAreas(optimized, context.focusAreas);
    }
    
    // Remove excluded patterns
    if (context.excludePatterns && context.excludePatterns.length > 0) {
      optimized = this.removePatterns(optimized, context.excludePatterns);
    }
    
    return optimized;
  }

  /**
   * Truncate prompt to fit within token limit
   */
  private truncateToTokenLimit(prompt: string, maxTokens: number): string {
    // Simple token estimation (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      return prompt;
    }
    
    // Keep essential sections and truncate others
    const sections = prompt.split('\n\n');
    const essentialKeywords = ['Core Rules', 'Database Information', 'User Requirements', 'Technical Stack'];
    
    const essentialSections = sections.filter(section => 
      essentialKeywords.some(keyword => section.includes(keyword))
    );
    
    const otherSections = sections.filter(section => 
      !essentialKeywords.some(keyword => section.includes(keyword))
    );
    
    // Start with essential sections
    let truncated = essentialSections.join('\n\n');
    
    // Add other sections until token limit is reached
    for (const section of otherSections) {
      const newPrompt = truncated + '\n\n' + section;
      const newTokens = Math.ceil(newPrompt.length / 4);
      
      if (newTokens <= maxTokens) {
        truncated = newPrompt;
      } else {
        break;
      }
    }
    
    return truncated;
  }

  /**
   * Emphasize specific focus areas in the prompt
   */
  private emphasizeFocusAreas(prompt: string, focusAreas: string[]): string {
    let emphasized = prompt;
    
    // Add emphasis section at the beginning
    const emphasisSection = `## IMPORTANT FOCUS AREAS:\n${focusAreas.map(area => `- **${area}**`).join('\n')}\n\n`;
    emphasized = emphasisSection + emphasized;
    
    // Also bold mentions of focus areas throughout the prompt
    for (const area of focusAreas) {
      const regex = new RegExp(`\\b(${area})\\b`, 'gi');
      emphasized = emphasized.replace(regex, '**$1**');
    }
    
    return emphasized;
  }

  /**
   * Remove specified patterns from prompt
   */
  private removePatterns(prompt: string, patterns: string[]): string {
    let cleaned = prompt;
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'g');
      cleaned = cleaned.replace(regex, '');
    }
    
    // Clean up any double newlines created by removal
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }

  /**
   * Get the default system prompt
   */
  getSystemPrompt(): string {
    return this.SYSTEM_PROMPT_TEMPLATE;
  }
}