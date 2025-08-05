import { SchemaInfo } from './schema-analyzer';
import { Template } from './template-engine';
import { ColumnMapper } from '../utils/column-mapper';

/**
 * Interface for Prompt Builder operations
 */
export interface IPromptBuilder {
  buildPrompt(components: PromptComponents): string;
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
  visualizationType?: string;
  additionalRequirements?: string[];
  constraints?: string[];
}


/**
 * Simplified Prompt Builder - focuses on essentials only for better success rate
 */
export class PromptBuilder implements IPromptBuilder {
  private readonly SYSTEM_PROMPT_TEMPLATE = `You are VibeCraft-viz, a specialized agent for creating data visualization React applications.

## Your Task:
Create a complete, working React application that visualizes data from the provided SQLite database.

## Key Requirements:
1. Use Vite, React 18, and TypeScript
2. Use sql.js to query the SQLite database in the browser
3. Use Recharts for data visualization
4. Use Tailwind CSS for styling
5. The app must work immediately after 'npm install && npm run dev'
6. Handle loading states and errors properly

## Important:
- ALWAYS use path aliases: import from '@/components/...' not '../components/...'
- ALWAYS export your components properly
- The SQLite file will be at 'public/data.sqlite'
- Create all necessary files including package.json, vite.config.ts, tsconfig.json, etc.
- In tsconfig.json, only include 'src' folder, NOT 'vite.config.ts'`;

  buildPrompt(components: PromptComponents): string {
    const { schemaInfo, templateContent, userPrompt, projectContext } = components;
    
    // Build concise prompt
    let prompt = `${this.SYSTEM_PROMPT_TEMPLATE}

## Database Schema:
${this.formatSchema(schemaInfo)}

## Visualization Requirements:
${templateContent}

## User Request:
${userPrompt}
`;

    // Add geo-spatial specific instructions if needed
    if (projectContext?.visualizationType === 'geo-spatial') {
      prompt += `
## Geo-spatial Specific:
- Use leaflet and react-leaflet packages
- Import leaflet CSS in main.tsx: import "leaflet/dist/leaflet.css"
- Make sure map container has explicit height
`;
    }

    prompt += `

## Final Steps:
After generating all files, please:
1. Run 'npm run build' to verify the app builds without errors
2. If you encounter TypeScript errors, fix them immediately:
   - Remove unused imports
   - Fix type mismatches (e.g., 'null' returns should be wrapped in fragments: <>{null}</>)
   - Ensure all components have proper return types
3. Make sure all essential files exist:
   - src/main.tsx (entry point)
   - src/App.tsx (main component)
   - All imported components

Please generate the complete React application code and perform these verifications.`;

    return prompt.trim();
  }

  private formatSchema(schemaInfo: SchemaInfo): string {
    let result = '';
    
    for (const table of schemaInfo.tables) {
      result += `Table: ${table.name}\n`;
      result += `Columns: ${table.columns.map(col => `${col.name} (${col.type})`).join(', ')}\n`;
      if (table.sampleData && table.sampleData.length > 0) {
        result += `Sample: ${JSON.stringify(table.sampleData[0])}\n`;
      }
      result += '\n';
    }
    
    return result.trim();
  }


  getSystemPrompt(): string {
    return this.SYSTEM_PROMPT_TEMPLATE;
  }
}