# Dashboard Template Guidelines

This directory contains template-specific instructions for different dashboard types.

## Common Dashboard Features

All dashboards should include:
- Responsive layout using Tailwind CSS grid/flexbox
- Loading states while fetching data
- Error boundaries for graceful error handling
- Export functionality (CSV and JSON)
- Proper TypeScript types (if using TypeScript)

## Data Processing Best Practices

1. **Date Handling**
   - Parse dates consistently using a utility function
   - Format dates for display vs. calculation differently
   - Handle timezone considerations

2. **Number Formatting**
   - Use Intl.NumberFormat for locale-aware formatting
   - Round appropriately for display
   - Handle null/undefined values

3. **Aggregation**
   - Perform aggregations in SQL when possible
   - Use efficient JavaScript methods for client-side processing
   - Cache computed values with useMemo

## Chart Configuration

### Recharts Common Settings
```javascript
const commonChartProps = {
  margin: { top: 5, right: 30, left: 20, bottom: 5 },
  data: processedData
};

const commonAxisProps = {
  tick: { fontSize: 12 },
  tickFormatter: (value) => formatValue(value)
};
```

## Performance Optimization

1. Use React.memo for expensive components
2. Implement virtual scrolling for large datasets
3. Debounce user inputs and resize handlers
4. Lazy load components when appropriate

## Accessibility

1. Add proper ARIA labels to interactive elements
2. Ensure keyboard navigation works
3. Provide text alternatives for visual information
4. Use semantic HTML elements