import { AgentCliArgs } from '../types';
import path from 'path';
import fs from 'fs-extra';

export interface NormalizedRequest extends AgentCliArgs {
  workingDir: string;
  timestamp: string;
}

export class RequestNormalizer {
  normalizeRequest(request: AgentCliArgs): NormalizedRequest {
    const timestamp = new Date().toISOString();
    const workingDir = this.createWorkingDirectory(request.outputDir, request.projectName);
    
    return {
      ...request,
      sqlitePath: path.resolve(request.sqlitePath),
      outputDir: this.normalizeOutputDir(request.outputDir),
      projectName: this.normalizeProjectName(request.projectName, request.visualizationType),
      userPrompt: request.userPrompt.trim(),
      workingDir,
      timestamp
    };
  }
  
  private normalizeOutputDir(dir: string): string {
    // 출력 디렉토리 정규화
    const normalizedPath = path.resolve(dir);
    
    // 타임스탬프 추가 옵션
    if (process.env.VIBECRAFT_ADD_TIMESTAMP === 'true') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(normalizedPath, timestamp);
    }
    
    return normalizedPath;
  }
  
  private normalizeProjectName(name: string | undefined, vizType: string): string {
    if (name) {
      // 특수문자 제거 및 케밥케이스 변환
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // 기본 프로젝트 이름 생성
    const timestamp = Date.now();
    return `vibecraft-${vizType}-${timestamp}`;
  }
  
  private createWorkingDirectory(outputDir: string, projectName?: string): string {
    // 항상 outputDir 안에 projectName 디렉토리를 생성
    // projectName이 없으면 normalizeProjectName에서 자동 생성됨
    const finalProjectName = projectName || `vibecraft-${Date.now()}`;
    const workingDir = path.join(outputDir, finalProjectName);
    
    // 이미 존재하는 디렉토리인 경우 타임스탬프 추가
    let finalWorkingDir = workingDir;
    let counter = 1;
    while (fs.existsSync(finalWorkingDir)) {
      finalWorkingDir = `${workingDir}-${counter}`;
      counter++;
    }
    
    // 작업 디렉토리 생성
    fs.ensureDirSync(finalWorkingDir);
    
    // .gemini 디렉토리 생성 (settings.json을 위해)
    const geminiDir = path.join(finalWorkingDir, '.gemini');
    fs.ensureDirSync(geminiDir);
    
    return finalWorkingDir;
  }
  
  // 시각화 타입에 따른 기본 설정 추가
  getVisualizationDefaults(vizType: string): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      'time-series': {
        chartLibrary: 'recharts',
        defaultTimeFormat: 'YYYY-MM-DD',
        enableAnimations: true
      },
      'geo-spatial': {
        mapLibrary: 'react-leaflet',
        defaultCenter: [37.5665, 126.9780], // Seoul
        defaultZoom: 10
      },
      'gantt-chart': {
        chartLibrary: 'gantt-chart-react',
        enableDragDrop: true,
        showDependencies: true
      },
      'kpi-dashboard': {
        refreshInterval: 30000, // 30초
        enableRealtime: true,
        cardLayout: 'grid'
      },
      'custom': {
        chartLibrary: 'recharts',
        enableAllFeatures: true
      }
    };
    
    return defaults[vizType] || defaults['custom'];
  }
}