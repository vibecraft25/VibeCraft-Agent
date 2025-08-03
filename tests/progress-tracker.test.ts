import { ProgressTracker } from '../src/utils/progress-tracker';

// Mock ora
jest.mock('ora', () => {
  const mockOra = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    text: ''
  };
  
  return jest.fn(() => mockOra);
});

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;
  
  beforeEach(() => {
    jest.clearAllMocks();
    tracker = new ProgressTracker();
  });
  
  describe('step management', () => {
    test('should add steps', () => {
      tracker.addStep('Step 1', 'Description 1');
      tracker.addStep('Step 2');
      
      const summary = tracker.getSummary();
      expect(summary.total).toBe(2);
      expect(summary.steps[0].name).toBe('Step 1');
      expect(summary.steps[0].description).toBe('Description 1');
      expect(summary.steps[1].name).toBe('Step 2');
    });
    
    test('should add multiple steps at once', () => {
      tracker.addSteps([
        { name: 'Step 1', description: 'Desc 1' },
        { name: 'Step 2' },
        { name: 'Step 3', description: 'Desc 3' }
      ]);
      
      const summary = tracker.getSummary();
      expect(summary.total).toBe(3);
    });
  });
  
  describe('step progression', () => {
    beforeEach(() => {
      tracker.addSteps([
        { name: 'Step 1' },
        { name: 'Step 2' },
        { name: 'Step 3' }
      ]);
    });
    
    test('should progress through steps', () => {
      tracker.start();
      
      tracker.nextStep();
      let current = tracker.getCurrentStep();
      expect(current?.name).toBe('Step 1');
      expect(current?.status).toBe('running');
      
      tracker.nextStep();
      current = tracker.getCurrentStep();
      expect(current?.name).toBe('Step 2');
      
      const summary = tracker.getSummary();
      expect(summary.steps[0].status).toBe('completed');
      expect(summary.steps[1].status).toBe('running');
      expect(summary.steps[2].status).toBe('pending');
    });
    
    test('should complete steps with succeed', () => {
      tracker.start();
      tracker.nextStep();
      tracker.succeed('Step 1 done');
      
      const summary = tracker.getSummary();
      expect(summary.steps[0].status).toBe('completed');
      expect(summary.completed).toBe(1);
    });
    
    test('should fail steps', () => {
      tracker.start();
      tracker.nextStep();
      tracker.fail('Something went wrong');
      
      const summary = tracker.getSummary();
      expect(summary.steps[0].status).toBe('failed');
      expect(summary.steps[0].error).toBe('Something went wrong');
      expect(summary.failed).toBe(1);
    });
  });
  
  describe('progress tracking', () => {
    test('should calculate progress', () => {
      tracker.addSteps([
        { name: 'Step 1' },
        { name: 'Step 2' },
        { name: 'Step 3' },
        { name: 'Step 4' }
      ]);
      
      let progress = tracker.getProgress();
      expect(progress).toEqual({
        current: 0,
        total: 4,
        percentage: 0
      });
      
      tracker.start();
      tracker.nextStep();
      tracker.succeed();
      
      progress = tracker.getProgress();
      expect(progress).toEqual({
        current: 1,
        total: 4,
        percentage: 25
      });
      
      tracker.nextStep();
      tracker.succeed();
      
      progress = tracker.getProgress();
      expect(progress).toEqual({
        current: 2,
        total: 4,
        percentage: 50
      });
    });
  });
  
  describe('summary', () => {
    test('should provide complete summary', async () => {
      tracker.addSteps([
        { name: 'Step 1' },
        { name: 'Step 2' },
        { name: 'Step 3' }
      ]);
      
      tracker.start();
      
      // Complete step 1
      tracker.nextStep();
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.succeed();
      
      // Fail step 2
      tracker.nextStep();
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.fail('Error in step 2');
      
      // Skip step 3
      
      const summary = tracker.getSummary();
      
      expect(summary.total).toBe(3);
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.success).toBe(false);
      expect(summary.totalDuration).toBeGreaterThan(0);
      
      // Check individual steps
      expect(summary.steps[0].status).toBe('completed');
      expect(summary.steps[0].endTime).toBeGreaterThan(summary.steps[0].startTime!);
      
      expect(summary.steps[1].status).toBe('failed');
      expect(summary.steps[1].error).toBe('Error in step 2');
      
      expect(summary.steps[2].status).toBe('pending');
      expect(summary.steps[2].startTime).toBeNull();
    });
    
    test('should print summary', () => {
      tracker.addSteps([
        { name: 'Step 1' },
        { name: 'Step 2' }
      ]);
      
      tracker.start();
      tracker.nextStep();
      tracker.succeed();
      tracker.nextStep();
      tracker.fail('Failed step');
      
      tracker.printSummary();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Summary:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✓ Step 1'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✗ Step 2'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Failed step'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('1/2 completed'));
    });
  });
  
  describe('silent mode', () => {
    test('should not output in silent mode', () => {
      const silentTracker = new ProgressTracker(true);
      
      silentTracker.addStep('Step 1');
      silentTracker.start('Starting...');
      silentTracker.nextStep();
      silentTracker.update('Updating...');
      silentTracker.info('Info message');
      silentTracker.warn('Warning message');
      silentTracker.succeed('Done');
      silentTracker.printSummary();
      
      // ora should not be called in silent mode
      const ora = require('ora');
      expect(ora).not.toHaveBeenCalled();
    });
  });
  
  describe('reset', () => {
    test('should reset tracker state', () => {
      tracker.addSteps([
        { name: 'Step 1' },
        { name: 'Step 2' }
      ]);
      
      tracker.start();
      tracker.nextStep();
      tracker.succeed();
      
      tracker.reset();
      
      const summary = tracker.getSummary();
      expect(summary.total).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.steps).toHaveLength(0);
      expect(tracker.getCurrentStep()).toBeNull();
    });
  });
  
  describe('utility methods', () => {
    test('should format duration correctly', async () => {
      // Test duration formatting through actual timing
      tracker.addStep('Test Step');
      tracker.start();
      tracker.nextStep();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tracker.succeed();
      
      const summary = tracker.getSummary();
      const step = summary.steps[0];
      
      // Check that times were recorded
      expect(step.startTime).toBeTruthy();
      expect(step.endTime).toBeTruthy();
      expect(step.endTime! - step.startTime!).toBeGreaterThan(0);
      expect(step.endTime! - step.startTime!).toBeLessThan(1000); // Should be less than 1 second
    });
    
    test('createSimple should create standalone spinner', () => {
      const ora = require('ora');
      const spinner = ProgressTracker.createSimple('Loading...');
      
      expect(ora).toHaveBeenCalledWith({
        text: 'Loading...',
        spinner: 'dots'
      });
      expect(spinner.start).toHaveBeenCalled();
    });
  });
});