import { SchemaInfo } from './schema-analyzer';
import { Template } from './template-engine';
import { ColumnMapper } from '../utils/column-mapper';

/**
 * Interface for Prompt Builder operations
 */
export interface IPromptBuilder {
  buildPrompt(components: PromptComponents): string;
}

/**
 * Components needed to build a complete prompt
 */
export interface PromptComponents {
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
  sqlitePath: string;
  additionalRequirements?: string[];
  constraints?: string[];
}


/**
 * Simplified Prompt Builder - focuses on essentials only for better success rate
 *
 * Note: GEMINI.md is automatically loaded by Gemini CLI and should NOT be included here.
 * This builder only creates the task-specific prompt that will be combined with GEMINI.md.
 */
export class PromptBuilder implements IPromptBuilder {

  buildPrompt(components: PromptComponents): string {
    const { schemaInfo, templateContent, userPrompt, projectContext } = components;

    // Build task-specific prompt (GEMINI.md is automatically loaded by Gemini CLI)
    let prompt = `

## Database Setup:
The SQLite database is already available at: public/data.sqlite
- This file has been prepared for you by VibeCraft
- Use sql.js to load and query it in your React app
- Example: const db = await initSqlJs(); db.open('public/data.sqlite');

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
## Geo-spatial Critical Requirements:

### 1. Libraries & Setup:
- leaflet and react-leaflet packages
- Import CSS: import "leaflet/dist/leaflet.css" in main.tsx
- Map container needs explicit height (e.g., h-[600px])

### 2. Performance (REQUIRED):
**Always limit data in SQL queries to prevent browser freeze**

Default pattern:
\`\`\`sql
SELECT * FROM stores ORDER BY monthly_revenue DESC LIMIT 500;
\`\`\`

### 3. User Controls:
Add these UI controls above the map:

\`\`\`typescript
// Limit selector
const [limit, setLimit] = useState(500);

// Query with limit
const query = \`SELECT * FROM stores LIMIT \${limit}\`;
\`\`\`

Controls needed:
- Limit dropdown: [500, 1000, All]
- Stats display: "Showing X of Y stores"
- Optional: City filter dropdown

### 4. Warning:
If user selects "All", show: "⚠️ Loading all markers may slow down the browser"
`;
    }

    prompt += `

## Verification:
After generating all files:
1. Run 'npm install' to install dependencies
2. Run 'npm run build' to catch any TypeScript errors
3. Fix any build errors before stopping

Important: Do NOT run 'npm run dev' as it starts a server that keeps running.`;

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
}