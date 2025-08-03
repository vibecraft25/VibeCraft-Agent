# Task 7: Prompt Builder 모듈 구현

## 목표
시스템 프롬프트, 타입별 템플릿, 사용자 프롬프트를 조합하여 최종 프롬프트를 생성하는 Prompt Builder 모듈을 구현합니다.

## 작업 내용

### 7.1 Prompt Builder 인터페이스 정의
```typescript
// src/core/prompt-builder.ts
import { SchemaInfo } from './schema-analyzer';
import { Template } from './template-engine';
import { VisualizationType } from '../types';

export interface IPromptBuilder {
  buildPrompt(components: PromptComponents): string;
  optimizePrompt(prompt: string, context: OptimizationContext): string;
}

export interface PromptComponents {
  systemPrompt: string;
  template: Template;
  userPrompt: string;
  schemaInfo: SchemaInfo;
  projectContext?: ProjectContext;
}

export interface ProjectContext {
  projectName: string;
  outputDir: string;
  additionalRequirements?: string[];
  constraints?: string[];
}

export interface OptimizationContext {
  maxTokens?: number;
  focusAreas?: string[];
  excludePatterns?: string[];
}
```

### 7.2 Prompt Builder 구현
```typescript
// src/core/prompt-builder.ts (계속)
export class PromptBuilder implements IPromptBuilder {
  private readonly SYSTEM_PROMPT_TEMPLATE = `
You are VibeCraft-viz, a specialized agent for creating data visualization React applications.

## Core Rules:
1. Always create a complete, runnable React application
2. Use sql.js for browser-based SQLite access
3. Include all necessary dependencies in package.json
4. Implement responsive design with Tailwind CSS
5. Add proper error handling and loading states

## Technical Stack:
- React 18.x
- TypeScript (optional based on user preference)
- Recharts/Chart.js for visualizations
- sql.js for SQLite operations
- Tailwind CSS for styling
- {{additionalLibraries}}

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
`;

  buildPrompt(components: PromptComponents): string {
    // 1. 시스템 프롬프트 준비
    const systemPrompt = this.prepareSystemPrompt(
      this.SYSTEM_PROMPT_TEMPLATE,
      components.template.requiredLibraries
    );
    
    // 2. 스키마 정보 포맷팅
    const schemaSection = this.formatSchemaSection(components.schemaInfo);
    
    // 3. 타입별 템플릿 준비
    const typeSpecificSection = this.prepareTypeSpecificSection(
      components.template,
      components.schemaInfo
    );
    
    // 4. 사용자 요구사항 섹션
    const userRequirementsSection = this.formatUserRequirements(
      components.userPrompt,
      components.projectContext
    );
    
    // 5. 추가 지시사항
    const additionalInstructions = this.generateAdditionalInstructions(
      components.projectContext
    );
    
    // 6. 최종 프롬프트 조합
    const finalPrompt = `
${systemPrompt}

## Database Information:
- SQLite Path: /data.sqlite (will be copied to public/)
${schemaSection}

${typeSpecificSection}

## User Requirements:
${userRequirementsSection}

${additionalInstructions}

Now, please generate the complete React application code.
`;
    
    return finalPrompt.trim();
  }
  
  private prepareSystemPrompt(template: string, libraries: string[]): string {
    const additionalLibs = libraries.length > 0 
      ? libraries.join('\n- ') 
      : 'No additional libraries required';
    
    return template.replace('{{additionalLibraries}}', additionalLibs);
  }
  
  private formatSchemaSection(schemaInfo: SchemaInfo): string {
    let section = `- Tables: ${schemaInfo.tables.map(t => t.name).join(', ')}\n`;
    section += '- Schema:\n\n';
    
    for (const table of schemaInfo.tables) {
      section += `### Table: ${table.name}\n`;
      section += `Row Count: ${table.rowCount}\n\n`;
      section += 'Columns:\n';
      
      for (const col of table.columns) {
        const attributes = [];
        if (col.isPrimaryKey) attributes.push('PRIMARY KEY');
        if (col.isForeignKey) attributes.push('FOREIGN KEY');
        if (!col.nullable) attributes.push('NOT NULL');
        
        const attrString = attributes.length > 0 ? ` (${attributes.join(', ')})` : '';
        section += `- ${col.name}: ${col.type}${attrString}\n`;
        
        if (col.dataDistribution) {
          section += `  - Unique values: ${col.dataDistribution.uniqueValues}\n`;
          section += `  - Null count: ${col.dataDistribution.nullCount}\n`;
          if (col.dataDistribution.minValue !== undefined) {
            section += `  - Range: ${col.dataDistribution.minValue} to ${col.dataDistribution.maxValue}\n`;
          }
        }
      }
      
      if (table.foreignKeys.length > 0) {
        section += '\nForeign Keys:\n';
        for (const fk of table.foreignKeys) {
          section += `- ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
        }
      }
      
      if (table.sampleData && table.sampleData.length > 0) {
        section += '\nSample Data:\n```json\n';
        section += JSON.stringify(table.sampleData.slice(0, 3), null, 2);
        section += '\n```\n';
      }
      
      section += '\n';
    }
    
    if (schemaInfo.relationships.length > 0) {
      section += '### Relationships:\n';
      for (const rel of schemaInfo.relationships) {
        section += `- ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn} (${rel.type})\n`;
      }
    }
    
    return section;
  }
  
  private prepareTypeSpecificSection(template: Template, schemaInfo: SchemaInfo): string {
    let section = `## Visualization Type: ${template.name}\n\n`;
    
    // typeSpecificPrompt는 이제 Markdown 파일에서 로드된 완전한 프롬프트
    section += template.typeSpecificPrompt + '\n\n';
    
    // 컴포넌트 구조 추가 (meta.json에서 로드된 경우)
    if (template.componentStructure) {
      section += this.formatComponentStructure(template.componentStructure);
    }
    
    // 데이터 처리 패턴 추가 (meta.json에서 로드된 경우)
    if (template.dataProcessingPatterns) {
      section += this.formatDataPatterns(template.dataProcessingPatterns, schemaInfo);
    }
    
    return section;
  }
  
  private formatComponentStructure(structure: ComponentStructure): string {
    let formatted = '### Required Components:\n\n';
    
    for (const comp of structure.mainComponents) {
      formatted += `#### ${comp.name}\n`;
      formatted += `${comp.description}\n`;
      formatted += `- Props: ${comp.props.map(p => `${p.name}: ${p.type}`).join(', ')}\n`;
      formatted += `- Features: ${comp.features.join(', ')}\n\n`;
    }
    
    return formatted;
  }
  
  private formatDataPatterns(patterns: DataPattern[], schemaInfo: SchemaInfo): string {
    let formatted = '### Data Processing Examples:\n\n';
    
    for (const pattern of patterns) {
      formatted += `#### ${pattern.name}\n`;
      
      // SQL 템플릿에 실제 테이블/컬럼 이름 주입
      const adaptedSQL = this.adaptSQLToSchema(pattern.sqlTemplate, schemaInfo);
      formatted += '```sql\n' + adaptedSQL + '\n```\n\n';
      
      formatted += 'Processing function:\n';
      formatted += '```javascript\n' + pattern.dataTransformation + '\n```\n\n';
    }
    
    return formatted;
  }
  
  private adaptSQLToSchema(sqlTemplate: string, schemaInfo: SchemaInfo): string {
    let adapted = sqlTemplate;
    
    // 첫 번째 테이블을 기본 테이블로 사용
    if (schemaInfo.tables.length > 0) {
      const mainTable = schemaInfo.tables[0];
      adapted = adapted.replace(/\{\{tableName\}\}/g, mainTable.name);
      
      // 시간 관련 컬럼 찾기
      const timeColumn = mainTable.columns.find(col => 
        col.type.toLowerCase().includes('date') || 
        col.type.toLowerCase().includes('time') ||
        col.name.toLowerCase().includes('date') ||
        col.name.toLowerCase().includes('time')
      );
      
      if (timeColumn) {
        adapted = adapted.replace(/\{\{timeColumn\}\}/g, timeColumn.name);
      }
      
      // 숫자형 컬럼들 찾기
      const numericColumns = mainTable.columns
        .filter(col => col.type.toLowerCase().includes('int') || 
                      col.type.toLowerCase().includes('real') ||
                      col.type.toLowerCase().includes('numeric'))
        .map(col => col.name)
        .join(', ');
      
      adapted = adapted.replace(/\{\{metricColumns\}\}/g, numericColumns);
    }
    
    return adapted;
  }
  
  private formatUserRequirements(userPrompt: string, context?: ProjectContext): string {
    let requirements = userPrompt;
    
    if (context) {
      if (context.projectName) {
        requirements = `Project Name: ${context.projectName}\n\n${requirements}`;
      }
      
      if (context.additionalRequirements && context.additionalRequirements.length > 0) {
        requirements += '\n\nAdditional Requirements:\n';
        requirements += context.additionalRequirements.map(req => `- ${req}`).join('\n');
      }
    }
    
    return requirements;
  }
  
  private generateAdditionalInstructions(context?: ProjectContext): string {
    const instructions = [
      '## Additional Instructions:',
      '- The SQLite database is already created and available',
      '- Copy the database file to the public/ directory of the React app',
      '- Ensure all queries work with the actual schema provided above',
      '- Create a fully functional application that can be run immediately',
      '- Include proper error handling for database operations',
      '- Add loading states while data is being fetched',
      '- Implement responsive design that works on mobile and desktop',
      '- Output all files to the current directory'
    ];
    
    if (context?.constraints) {
      instructions.push('', 'Constraints:');
      instructions.push(...context.constraints.map(c => `- ${c}`));
    }
    
    return instructions.join('\n');
  }
  
  optimizePrompt(prompt: string, context: OptimizationContext): string {
    let optimized = prompt;
    
    // 토큰 수 제한
    if (context.maxTokens) {
      optimized = this.truncateToTokenLimit(optimized, context.maxTokens);
    }
    
    // 포커스 영역 강조
    if (context.focusAreas && context.focusAreas.length > 0) {
      optimized = this.emphasizeFocusAreas(optimized, context.focusAreas);
    }
    
    // 제외 패턴 적용
    if (context.excludePatterns && context.excludePatterns.length > 0) {
      optimized = this.excludePatterns(optimized, context.excludePatterns);
    }
    
    return optimized;
  }
  
  private truncateToTokenLimit(prompt: string, maxTokens: number): string {
    // 간단한 토큰 추정 (실제로는 더 정교한 토크나이저 필요)
    const estimatedTokens = prompt.split(/\s+/).length * 1.3;
    
    if (estimatedTokens <= maxTokens) {
      return prompt;
    }
    
    // 우선순위가 낮은 섹션부터 제거
    const sections = prompt.split('\n\n');
    const prioritySections = sections.filter(s => 
      s.includes('Core Rules') || 
      s.includes('User Requirements') ||
      s.includes('Database Information')
    );
    
    return prioritySections.join('\n\n');
  }
  
  private emphasizeFocusAreas(prompt: string, focusAreas: string[]): string {
    let emphasized = prompt;
    
    for (const area of focusAreas) {
      const regex = new RegExp(`(${area})`, 'gi');
      emphasized = emphasized.replace(regex, '**$1**');
    }
    
    return emphasized;
  }
  
  private excludePatterns(prompt: string, patterns: string[]): string {
    let filtered = prompt;
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'g');
      filtered = filtered.replace(regex, '');
    }
    
    return filtered;
  }
}
```

### 7.3 프롬프트 검증 유틸리티
```typescript
// src/utils/prompt-validator.ts
export class PromptValidator {
  static validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 필수 섹션 확인
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
    
    // 프롬프트 길이 확인
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount > 10000) {
      warnings.push('Prompt is very long and may exceed token limits');
    }
    
    // SQL injection 위험 패턴 확인
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM.*WHERE\s+1=1/i,
      /;\s*--/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(prompt)) {
        warnings.push('Prompt contains potentially dangerous SQL patterns');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## 완료 기준
- [ ] Prompt Builder 인터페이스 구현
- [ ] 시스템 프롬프트 템플릿 정의
- [ ] 프롬프트 조합 로직
- [ ] 스키마 정보 포맷팅
- [ ] 프롬프트 최적화 기능
- [ ] 프롬프트 검증
- [ ] 단위 테스트 작성