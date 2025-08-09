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
  model?: 'flash' | 'pro';
  additionalRequirements?: string[];
  constraints?: string[];
}


/**
 * Simplified Prompt Builder - focuses on essentials only for better success rate
 */
export class PromptBuilder implements IPromptBuilder {
  private readonly SYSTEM_PROMPT_TEMPLATE = `You are VibeCraft-viz, a specialized agent for creating beautiful, modern data visualization React applications.

## Your Task:
Create a complete, working React application that visualizes data from the provided SQLite database with a polished, professional UI.

## Key Requirements:
1. Use Vite, React 18, and TypeScript
2. Use sql.js to query the SQLite database in the browser
3. Use Recharts for data visualization
4. Use Tailwind CSS for styling with custom theme
5. The app must work immediately after 'npm install && npm run dev'
6. Handle loading states and errors properly

## UI/UX Guidelines:
- Use modern card designs with rounded corners (rounded-xl) and soft shadows
- Apply hover effects with smooth transitions (hover:shadow-lg transition-all duration-300)
- Use a consistent color palette (primary: blue-500/600/700, gray scale)
- Add subtle borders (border border-gray-100) to cards
- Implement smooth loading animations (animate-pulse for skeletons)
- Ensure responsive design with proper spacing

## Important:
- ALWAYS use path aliases: import from '@/components/...' not '../components/...'
- ALWAYS export your components properly
- First create the 'public' directory, then copy the SQLite file to 'public/data.sqlite'
- The SQLite file will be at 'public/data.sqlite' for the app to access
- Create all necessary files including package.json, vite.config.ts, tsconfig.json, etc.
- In tsconfig.json, only include 'src' folder, NOT 'vite.config.ts'
- Configure Tailwind with extended theme for better visual design`;

  buildPrompt(components: PromptComponents): string {
    const { schemaInfo, templateContent, userPrompt, projectContext } = components;
    
    // Get SQLite path from context
    const sqlitePath = (projectContext as any)?.sqlitePath || '/path/to/data.sqlite';
    
    // Build concise prompt
    let prompt = `${this.SYSTEM_PROMPT_TEMPLATE}

## FIRST STEPS (MUST DO):
1. Create the public directory: mkdir public
2. Copy SQLite file: cp ${sqlitePath} public/data.sqlite
3. Verify the file exists before proceeding

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

## UI Design Requirements:
Please ensure the application has a modern, polished appearance:
1. Extend Tailwind config with custom colors and shadows
2. Use consistent spacing (p-6 for cards, gap-6 for grids)
3. Apply smooth transitions to all interactive elements
4. Use loading skeletons instead of simple spinners
5. Add hover states to all clickable elements

## Final Steps:
After generating all files, please:
1. Run 'npm install' to install dependencies
2. Run 'npm run build' to verify the app builds without errors (DO NOT run 'npm run dev' as it will keep running)
3. If you encounter TypeScript errors during build, fix them immediately:
   - Remove unused imports
   - Fix type mismatches (e.g., 'null' returns should be wrapped in fragments: <>{null}</>)
   - Ensure all components have proper return types
4. Make sure all essential files exist:
   - src/main.tsx (entry point)
   - src/App.tsx (main component)
   - All imported components
5. After successful build, stop - DO NOT start the development server

IMPORTANT: Only run 'npm run build' for verification. Do not run 'npm run dev' or 'npm run preview' as they will start servers that keep running.`;

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