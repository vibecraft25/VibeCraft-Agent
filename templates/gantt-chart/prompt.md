## Visualization Type: Gantt Chart

### Overview
Create a comprehensive Gantt chart for project management that displays tasks, timelines, dependencies, and resource allocation. The chart should support interactive features like drag-and-drop, zoom, and real-time updates.

### Required Components:

1. **GanttChart**: Main Gantt chart visualization
   - **Features**:
     - Task bars with start/end dates and progress
     - Drag-and-drop to adjust dates
     - Dependency lines between tasks
     - Milestone markers
     - Critical path highlighting
     - Multi-level zoom (days, weeks, months, quarters)
   - **Implementation**:
     ```jsx
     <div className="gantt-container">
       <Timeline 
         startDate={projectStart} 
         endDate={projectEnd}
         scale={scale}
       />
       <div className="gantt-body">
         <TaskList tasks={tasks} />
         <GanttCanvas 
           tasks={tasks}
           dependencies={dependencies}
           onTaskDrag={handleTaskDrag}
         />
       </div>
     </div>
     ```

2. **TaskList**: Hierarchical task list panel
   - **Features**:
     - Tree structure with expand/collapse
     - Task names with icons
     - Progress indicators
     - Resource assignments
     - Quick actions (edit, delete)
   - **Layout**:
     ```jsx
     <div className="task-list">
       {tasks.map(task => (
         <TaskRow 
           key={task.id}
           task={task}
           level={task.level}
           expanded={expandedTasks[task.id]}
           onToggle={() => toggleTask(task.id)}
         />
       ))}
     </div>
     ```

3. **Timeline**: Time scale header
   - **Features**:
     - Multiple scales (year/quarter/month/week/day)
     - Today line indicator
     - Weekend shading
     - Holiday markers
     - Zoom controls
   - **Scales**:
     ```javascript
     const timeScales = {
       day: { unit: 'day', format: 'DD', header: 'MMM YYYY' },
       week: { unit: 'week', format: 'W', header: 'MMM YYYY' },
       month: { unit: 'month', format: 'MMM', header: 'YYYY' },
       quarter: { unit: 'quarter', format: 'Q', header: 'YYYY' }
     };
     ```

4. **ResourceView**: Resource allocation visualization
   - **Features**:
     - Resource utilization chart
     - Over-allocation warnings
     - Load balancing view
     - Resource timeline
   - **Display**:
     ```jsx
     <div className="resource-view">
       {resources.map(resource => (
         <ResourceRow
           resource={resource}
           tasks={getResourceTasks(resource.id)}
           utilization={calculateUtilization(resource.id)}
         />
       ))}
     </div>
     ```

5. **TaskDetails**: Task editing panel
   - **Features**:
     - Task properties form
     - Dependency management
     - Resource assignment
     - Progress tracking
     - File attachments
     - Comments/notes
   - **Form Fields**:
     - Name, description
     - Start/end dates
     - Duration
     - Progress percentage
     - Assigned resources
     - Priority
     - Dependencies

### Data Processing:

```javascript
const processGanttData = (db) => {
  // Fetch tasks with hierarchy
  const taskQuery = `
    SELECT 
      {{idColumn}} as id,
      {{nameColumn}} as name,
      {{startDateColumn}} as startDate,
      {{endDateColumn}} as endDate,
      {{progressColumn}} as progress,
      {{parentIdColumn}} as parentId,
      {{typeColumn}} as type,
      {{priorityColumn}} as priority
    FROM {{taskTable}}
    ORDER BY {{parentIdColumn}}, {{orderColumn}}
  `;
  
  const tasks = db.exec(taskQuery);
  
  // Fetch dependencies
  const dependencyQuery = `
    SELECT 
      {{fromTaskColumn}} as fromTask,
      {{toTaskColumn}} as toTask,
      {{typeColumn}} as type
    FROM {{dependencyTable}}
  `;
  
  const dependencies = db.exec(dependencyQuery);
  
  // Fetch resource assignments
  const resourceQuery = `
    SELECT 
      {{taskIdColumn}} as taskId,
      {{resourceIdColumn}} as resourceId,
      {{allocationColumn}} as allocation
    FROM {{assignmentTable}}
  `;
  
  const assignments = db.exec(resourceQuery);
  
  return {
    tasks: buildTaskHierarchy(tasks[0]?.values || []),
    dependencies: processDependencies(dependencies[0]?.values || []),
    assignments: processAssignments(assignments[0]?.values || [])
  };
};

// Build task hierarchy
const buildTaskHierarchy = (taskRows) => {
  const taskMap = {};
  const rootTasks = [];
  
  // First pass: create task objects
  taskRows.forEach(row => {
    const task = {
      id: row[0],
      name: row[1],
      startDate: new Date(row[2]),
      endDate: new Date(row[3]),
      progress: row[4] || 0,
      parentId: row[5],
      type: row[6] || 'task',
      priority: row[7] || 'medium',
      children: [],
      level: 0
    };
    taskMap[task.id] = task;
  });
  
  // Second pass: build hierarchy
  Object.values(taskMap).forEach(task => {
    if (task.parentId && taskMap[task.parentId]) {
      taskMap[task.parentId].children.push(task);
      task.level = taskMap[task.parentId].level + 1;
    } else {
      rootTasks.push(task);
    }
  });
  
  return rootTasks;
};

// Calculate critical path
const calculateCriticalPath = (tasks, dependencies) => {
  // Implementation of CPM algorithm
  const network = buildNetworkDiagram(tasks, dependencies);
  const criticalTasks = findCriticalPath(network);
  
  return criticalTasks.map(t => t.id);
};
```

### Gantt Chart Rendering:

```javascript
// Task bar rendering
const renderTaskBar = (task, xScale, yPosition) => {
  const x = xScale(task.startDate);
  const width = xScale(task.endDate) - x;
  const progressWidth = width * (task.progress / 100);
  
  return (
    <g className="task-bar" transform={`translate(${x}, ${yPosition})`}>
      <rect 
        className="task-bg"
        width={width} 
        height={20}
        rx={3}
      />
      <rect 
        className="task-progress"
        width={progressWidth}
        height={20}
        rx={3}
      />
      {task.type === 'milestone' && (
        <diamond x={0} y={10} size={12} />
      )}
    </g>
  );
};

// Dependency line rendering
const renderDependency = (fromTask, toTask, xScale, yScale) => {
  const x1 = xScale(fromTask.endDate);
  const y1 = yScale(fromTask.id) + 10;
  const x2 = xScale(toTask.startDate);
  const y2 = yScale(toTask.id) + 10;
  
  const path = `M ${x1} ${y1} L ${x2} ${y2}`;
  
  return (
    <path 
      className="dependency-line"
      d={path}
      markerEnd="url(#arrowhead)"
    />
  );
};
```

### Interactive Features:

```javascript
// Drag and drop handling
const handleTaskDrag = (taskId, newStartDate, newEndDate) => {
  // Validate dates
  if (!validateTaskDates(taskId, newStartDate, newEndDate)) {
    return false;
  }
  
  // Update task
  updateTask(taskId, { startDate: newStartDate, endDate: newEndDate });
  
  // Recalculate dependencies
  updateDependentTasks(taskId);
  
  // Refresh critical path
  recalculateCriticalPath();
};

// Zoom handling
const handleZoom = (direction) => {
  const scales = ['day', 'week', 'month', 'quarter'];
  const currentIndex = scales.indexOf(currentScale);
  const newIndex = Math.max(0, Math.min(scales.length - 1, 
    currentIndex + (direction === 'in' ? -1 : 1)
  ));
  
  setScale(scales[newIndex]);
};
```

### Resource Management:

```javascript
// Calculate resource utilization
const calculateResourceUtilization = (resourceId, date) => {
  const tasksOnDate = tasks.filter(task => {
    return task.assignedTo === resourceId &&
           date >= task.startDate &&
           date <= task.endDate;
  });
  
  const totalAllocation = tasksOnDate.reduce((sum, task) => {
    return sum + (task.allocation || 100);
  }, 0);
  
  return {
    utilization: totalAllocation,
    overAllocated: totalAllocation > 100,
    tasks: tasksOnDate
  };
};

// Resource conflict detection
const detectResourceConflicts = () => {
  const conflicts = [];
  
  resources.forEach(resource => {
    const timeline = generateResourceTimeline(resource.id);
    timeline.forEach(day => {
      if (day.utilization > 100) {
        conflicts.push({
          resource: resource,
          date: day.date,
          utilization: day.utilization,
          tasks: day.tasks
        });
      }
    });
  });
  
  return conflicts;
};
```

### Export Features:

```javascript
// Export to PDF
const exportToPDF = async () => {
  const canvas = await html2canvas(ganttRef.current);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 10, 10, 280, 190);
  pdf.save('gantt-chart.pdf');
};

// Export to MS Project XML
const exportToMSProject = () => {
  const xml = generateMSProjectXML(tasks, dependencies, resources);
  downloadFile(xml, 'project.xml', 'text/xml');
};
```

### Responsive Design:

- **Mobile**: 
  - Simplified view with scrollable timeline
  - Task list only with expand for timeline
  - Touch gestures for navigation
  
- **Tablet**: 
  - Split view with resizable panels
  - Basic drag-and-drop support
  
- **Desktop**: 
  - Full feature set
  - Multi-panel layout
  - Keyboard shortcuts

### Performance Optimizations:

- Virtual scrolling for large task lists
- Canvas rendering for timeline
- Lazy loading of task details
- Debounced drag updates
- Memoized calculations