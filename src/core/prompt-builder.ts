import { SchemaInfo } from './schema-analyzer';
import { Template } from './template-engine';
import { ColumnMapper } from '../utils/column-mapper';

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
  visualizationType?: string;
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
  private currentContext?: ProjectContext;
  
  private readonly SYSTEM_PROMPT_TEMPLATE = `You are VibeCraft-viz, a specialized agent for creating data visualization React applications.

## Core Rules:
1. Always create a complete, runnable React application using Vite
2. Use sql.js for browser-based SQLite access
3. Include all necessary dependencies with EXACT versions in package.json
4. Implement responsive design with Tailwind CSS
5. Add proper error handling and loading states
6. Create the application in the current directory
7. Generate ALL files needed to run the app immediately after 'npm install && npm run dev'

## Technical Stack (USE EXACT VERSIONS):
- React 18.3.1 with functional components and hooks
- TypeScript 5.6.2 (if user requests or template specifies)
- Vite 5.4.10 as build tool
- Recharts 2.12.7 for data visualizations
- sql.js 1.12.0 for SQLite database operations
- Tailwind CSS 3.4.15 for styling
- date-fns 3.6.0 for date manipulation (if needed)
- @faker-js/faker 9.2.0 for mock data (if needed, use new API: faker.person.fullName() not faker.name.fullName())
- For geo-spatial: leaflet 1.9.4, react-leaflet 4.2.1, react-leaflet-cluster 2.1.0

## Project Initialization:
Create a Vite-based React project with these EXACT files:

### package.json (MUST include exact versions):
\`\`\`json
{
  "name": "vibecraft-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sql.js": "^1.12.0",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.2",
    "vite": "^5.4.10"
  }
}
\`\`\`

### vite.config.ts (REQUIRED for sql.js):
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['sql.js'],  // IMPORTANT: include, not exclude
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
\`\`\`

**IMPORTANT for geo-spatial**: If using Leaflet/OpenStreetMap, use this vite.config.ts instead:
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['sql.js'],
  },
  // No COEP/COOP headers for geo-spatial to allow loading map tiles
})
\`\`\`

### index.html (in root directory, NOT in public):
\`\`\`html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VibeCraft App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
\`\`\`

### src/main.tsx (entry point):
\`\`\`typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
\`\`\`

### src/index.css (Tailwind setup):
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

### tailwind.config.js:
\`\`\`javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`

### postcss.config.js:
\`\`\`javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
\`\`\`

### tsconfig.json (if using TypeScript):
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
\`\`\`

## Project Structure:
\`\`\`
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── data.sqlite
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── README.md
\`\`\`

## Data Access Pattern:
Always use the provided SQLite database through sql.js. IMPORTANT: Due to ESM module issues, you MUST import sql.js exactly as shown below:

\`\`\`typescript
// CRITICAL: Import sql.js correctly to avoid ESM issues
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

const loadDatabase = async (): Promise<Database> => {
  const sqlPromise = initSqlJs({
    locateFile: file => \`https://sql.js.org/dist/\${file}\`
  });
  const dataPromise = fetch('/data.sqlite').then(res => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  return new SQL.Database(new Uint8Array(buf));
};

// Example query execution
const executeQuery = (db: Database, query: string): any[] => {
  const stmt = db.prepare(query);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};
\`\`\`

**IMPORTANT SQL.JS NOTES:**
- The database file name in public folder should match the fetch URL exactly
- If the original file is 'sales-data.sqlite', rename it to 'data.sqlite' after copying to public/
- Always handle loading errors with proper error messages

## Important Requirements:
- The SQLite file will be automatically copied to public/data.sqlite (always use this filename)
- Always test SQL queries against the actual schema
- Include error boundaries for better error handling
- Use exact library versions to ensure compatibility
- Create a professional UI with good UX
- ALWAYS use Vite, NOT Create React App
- Place index.html in root directory, NOT in public/
- In vite.config.ts, use optimizeDeps: { include: ['sql.js'] }, NOT exclude`;

  /**
   * Build complete prompt from components
   */
  buildPrompt(components: PromptComponents): string {
    // Store context for use in other methods
    this.currentContext = components.projectContext;
    
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
      section += '\n';
    }
    
    // Add smart column mapping suggestions
    const visualizationType = this.currentContext?.visualizationType;
    if (visualizationType) {
      const columnMapping = ColumnMapper.mapColumnsForVisualization(
        schemaInfo.tables,
        visualizationType
      );
      
      if (Object.keys(columnMapping).length > 0) {
        section += `### Suggested Column Mappings for ${visualizationType}:\n`;
        section += '```javascript\n';
        section += JSON.stringify(columnMapping, null, 2);
        section += '\n```\n\n';
        section += 'These mappings are automatically detected based on column names and data types. ';
        section += 'Use them as a starting point and adjust as needed.\n';
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
      '   - Generate ALL files listed in the project structure above',
      '   - Create a complete, production-ready React application using Vite',
      '   - Include all necessary configuration files (vite.config.ts, tailwind.config.js, etc.)',
      '   - Ensure the app runs immediately after npm install && npm run dev',
      '',
      '2. **Database Integration**:',
      '   - The SQLite file is already available and will be copied to public/data.sqlite',
      '   - Use sql.js to query the database in the browser',
      '   - Implement proper error handling for database operations',
      '   - Use the exact code pattern shown above for loading the database',
      '',
      '3. **UI/UX Requirements**:',
      '   - Create a professional, modern interface',
      '   - Ensure responsive design for all screen sizes',
      '   - Add loading states and error messages',
      '   - Use Tailwind CSS for consistent styling',
      '   - Include hover effects and transitions for better UX',
      '',
      '4. **Code Quality**:',
      '   - Use React 18 best practices (functional components, hooks)',
      '   - Add TypeScript with proper types if specified in the template',
      '   - Include helpful comments for complex logic',
      '   - Ensure the code is maintainable and scalable',
      '   - Handle all edge cases (empty data, errors, loading)',
      '',
      '5. **Common Pitfalls to Avoid**:',
      '   - Do NOT use Create React App, use Vite',
      '   - Do NOT place index.html in public/, it goes in root',
      '   - Do NOT use old faker API (faker.name.x), use new API (faker.person.x)',
      '   - Do NOT forget to include all config files (vite.config.ts is required)',
      '   - Do NOT use approximate versions, use exact versions in package.json',
      '   - Do NOT exclude sql.js in vite.config.ts, use include instead',
      '   - Do NOT change the database filename - always use /data.sqlite in fetch()',
      '   - Do NOT use alternative sql.js import methods - use exactly as shown'
    ];
    
    // Add geo-spatial specific instructions
    if (context?.visualizationType === 'geo-spatial') {
      instructions.push(
        '',
        '6. **GEO-SPATIAL SPECIFIC REQUIREMENTS**:',
        '   - MUST include react-leaflet-cluster in package.json dependencies',
        '   - Import MarkerClusterGroup from "react-leaflet-cluster" (NOT leaflet.markercluster)',
        '   - Required dependencies:',
        '     * "leaflet": "^1.9.4"',
        '     * "react-leaflet": "^4.2.1"',
        '     * "react-leaflet-cluster": "^2.1.0"',
        '   - CSS imports in main.tsx - ONLY include:',
        '     * import "leaflet/dist/leaflet.css" (REQUIRED)',
        '     * Do NOT add any other CSS imports for clustering',
        '     * Do NOT import "react-leaflet-cluster/lib/assets/MarkerCluster.css"',
        '     * Do NOT import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css"',
        '   - CRITICAL: Do NOT include COEP/COOP headers in vite.config.ts',
        '   - Use simplified vite.config.ts without security headers to allow map tiles loading',
        '   - IMPORTANT: Map container height issue:',
        '     * The main container MUST have explicit height, not just flex-grow',
        '     * Use: <main className="flex-grow relative h-0 min-h-0">',
        '     * This ensures MapContainer with height: 100% works properly',
        '     * Without explicit height, Leaflet maps will not render'
      );
    }
    
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