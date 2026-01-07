import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  Shuffle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// Import dataset generation functions
import { generateClassificationDataset, generateRegressionDataset } from '@/utils/quantumMLPrimitives';

interface DataPoint {
  x: number;
  y: number;
  label?: number;
  predictedLabel?: number;
  features: number[];
}

interface QuantumMLDatasetVisualizerProps {
  onDataChange?: (data: DataPoint[]) => void;
  predictions?: number[];
  showPredictions?: boolean;
}

const QuantumMLDatasetVisualizer: React.FC<QuantumMLDatasetVisualizerProps> = ({
  onDataChange,
  predictions = [],
  showPredictions = false
}) => {
  const [datasetType, setDatasetType] = useState<'classification' | 'regression'>('classification');
  const [pattern, setPattern] = useState<'circles' | 'moons' | 'blobs' | 'xor' | 'linear' | 'quadratic' | 'sine' | 'exponential'>('circles');
  const [numSamples, setNumSamples] = useState(100);
  const [noise, setNoise] = useState(0.1);
  const [data, setData] = useState<DataPoint[]>([]);
  const [visualizationMode, setVisualizationMode] = useState<'scatter' | 'histogram' | 'correlation'>('scatter');
  const [showGrid, setShowGrid] = useState(true);
  const [colorByLabel, setColorByLabel] = useState(true);

  // Generate initial dataset
  useEffect(() => {
    generateDataset();
  }, [datasetType, pattern, numSamples, noise]);

  const generateDataset = () => {
    let generatedData: { data: number[][]; labels?: number[]; targets?: number[] };

    if (datasetType === 'classification') {
      generatedData = generateClassificationDataset(pattern as any, numSamples);
    } else {
      generatedData = generateRegressionDataset(pattern as any, numSamples);
    }

    const formattedData: DataPoint[] = generatedData.data.map((point, index) => ({
      x: point[0],
      y: point[1] || (generatedData.targets ? generatedData.targets[index] : 0),
      label: generatedData.labels ? generatedData.labels[index] : undefined,
      features: point
    }));

    setData(formattedData);
    onDataChange?.(formattedData);
  };

  const exportData = () => {
    const csvContent = [
      ['x', 'y', 'label', 'features'].join(','),
      ...data.map(point => [
        point.x,
        point.y,
        point.label || '',
        JSON.stringify(point.features)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern}_dataset.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dataset exported successfully');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');

        const importedData: DataPoint[] = lines.slice(1).map(line => {
          const values = line.split(',');
          return {
            x: parseFloat(values[0]),
            y: parseFloat(values[1]),
            label: values[2] ? parseInt(values[2]) : undefined,
            features: JSON.parse(values[3] || '[]')
          };
        });

        setData(importedData);
        onDataChange?.(importedData);
        toast.success('Dataset imported successfully');
      } catch (error) {
        toast.error('Failed to import dataset');
      }
    };
    reader.readAsText(file);
  };

  const getScatterData = () => {
    return data.map((point, index) => ({
      x: point.x,
      y: point.y,
      label: point.label,
      prediction: predictions[index],
      color: getPointColor(point, index)
    }));
  };

  const getPointColor = (point: DataPoint, index: number) => {
    if (showPredictions && predictions[index] !== undefined) {
      // Color by prediction
      return predictions[index] > 0.5 ? '#ef4444' : '#3b82f6';
    } else if (colorByLabel && point.label !== undefined) {
      // Color by true label
      return point.label === 1 ? '#ef4444' : '#3b82f6';
    } else {
      // Default color
      return '#6b7280';
    }
  };

  const getHistogramData = () => {
    if (datasetType === 'classification') {
      const labelCounts = data.reduce((acc, point) => {
        const label = point.label || 0;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      return Object.entries(labelCounts).map(([label, count]) => ({
        label: `Class ${label}`,
        count,
        percentage: (count / data.length) * 100
      }));
    } else {
      // For regression, create bins
      const minY = Math.min(...data.map(d => d.y));
      const maxY = Math.max(...data.map(d => d.y));
      const binCount = 10;
      const binSize = (maxY - minY) / binCount;

      const bins = Array(binCount).fill(0);
      data.forEach(point => {
        const binIndex = Math.min(Math.floor((point.y - minY) / binSize), binCount - 1);
        bins[binIndex]++;
      });

      return bins.map((count, index) => ({
        range: `${(minY + index * binSize).toFixed(2)} - ${(minY + (index + 1) * binSize).toFixed(2)}`,
        count
      }));
    }
  };

  const renderScatterPlot = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart data={getScatterData()}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          type="number"
          dataKey="x"
          name="Feature 1"
          domain={['dataMin - 0.5', 'dataMax + 0.5']}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={datasetType === 'classification' ? 'Feature 2' : 'Target'}
          domain={datasetType === 'classification' ? ['dataMin - 0.5', 'dataMax + 0.5'] : ['dataMin - 1', 'dataMax + 1']}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">Point Details</p>
                  <p>X: {data.x.toFixed(3)}</p>
                  <p>Y: {data.y.toFixed(3)}</p>
                  {data.label !== undefined && <p>True Label: {data.label}</p>}
                  {data.prediction !== undefined && <p>Prediction: {data.prediction.toFixed(3)}</p>}
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter dataKey="y">
          {getScatterData().map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Scatter>
        {datasetType === 'classification' && showPredictions && (
          <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="5 5" />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderHistogram = () => {
    const histData = getHistogramData();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {histData.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-primary">{item.count}</div>
              <div className="text-sm text-muted-foreground">
                {datasetType === 'classification' ? item.label : item.range}
              </div>
              {item.percentage && (
                <div className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Distribution visualization would be displayed here
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCorrelationMatrix = () => {
    // Calculate correlation matrix for features
    const features = data.map(d => d.features).filter(f => f.length > 1);
    if (features.length === 0) return null;

    const numFeatures = features[0].length;
    const correlations: number[][] = Array(numFeatures).fill(0).map(() => Array(numFeatures).fill(0));

    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          const valuesI = features.map(f => f[i]);
          const valuesJ = features.map(f => f[j]);
          correlations[i][j] = calculateCorrelation(valuesI, valuesJ);
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {correlations.map((row, i) => (
            <div key={i} className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium">Feature {i + 1}</span>
              <div className="flex-1 grid grid-cols-4 gap-1">
                {row.map((corr, j) => (
                  <div
                    key={j}
                    className="h-8 rounded flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: `hsl(${120 * (corr + 1) / 2}, 70%, 50%)`,
                      color: Math.abs(corr) > 0.5 ? 'white' : 'black'
                    }}
                  >
                    {corr.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Correlation Matrix (Green = Positive, Red = Negative)
        </div>
      </div>
    );
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Dataset Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Dataset Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={datasetType} onValueChange={(value: any) => setDatasetType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classification">Classification</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pattern */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pattern</label>
              <Select value={pattern} onValueChange={(value: any) => setPattern(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datasetType === 'classification' ? (
                    <>
                      <SelectItem value="circles">Concentric Circles</SelectItem>
                      <SelectItem value="moons">Two Moons</SelectItem>
                      <SelectItem value="blobs">Gaussian Blobs</SelectItem>
                      <SelectItem value="xor">XOR Pattern</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="quadratic">Quadratic</SelectItem>
                      <SelectItem value="sine">Sine Wave</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Sample Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Samples: {numSamples}</label>
              <Slider
                value={[numSamples]}
                onValueChange={(value) => setNumSamples(value[0])}
                min={50}
                max={500}
                step={25}
                className="w-full"
              />
            </div>

            {/* Visualization Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View</label>
              <Select value={visualizationMode} onValueChange={(value: any) => setVisualizationMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="histogram">Distribution</SelectItem>
                  <SelectItem value="correlation">Correlation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visualization Options */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <Label htmlFor="show-grid">Show Grid</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="color-by-label"
                checked={colorByLabel}
                onCheckedChange={setColorByLabel}
              />
              <Label htmlFor="color-by-label">Color by Label</Label>
            </div>

            {showPredictions && (
              <Badge variant="secondary">
                <Target className="w-3 h-3 mr-1" />
                Showing Predictions
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={generateDataset} variant="outline">
              <Shuffle className="w-4 h-4 mr-2" />
              Regenerate
            </Button>

            <Button onClick={exportData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <div>
              <input
                type="file"
                accept=".csv"
                onChange={importData}
                className="hidden"
                id="data-import"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('data-import')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {visualizationMode === 'scatter' && 'Scatter Plot'}
            {visualizationMode === 'histogram' && 'Data Distribution'}
            {visualizationMode === 'correlation' && 'Feature Correlations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <EyeOff className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No data to visualize. Generate a dataset first.
                </p>
              </div>
            </div>
          ) : (
            <>
              {visualizationMode === 'scatter' && renderScatterPlot()}
              {visualizationMode === 'histogram' && renderHistogram()}
              {visualizationMode === 'correlation' && renderCorrelationMatrix()}

              {/* Dataset Statistics */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{data.length}</div>
                  <div className="text-sm text-muted-foreground">Total Samples</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {data[0]?.features.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Features</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {datasetType === 'classification' ? new Set(data.map(d => d.label)).size : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Classes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {datasetType === 'regression' ?
                      `${Math.min(...data.map(d => d.y)).toFixed(2)} - ${Math.max(...data.map(d => d.y)).toFixed(2)}` :
                      'N/A'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Target Range</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantumMLDatasetVisualizer;