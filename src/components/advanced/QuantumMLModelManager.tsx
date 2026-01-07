import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Settings,
  History,
  Star,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

// Import quantum ML components
import {
  serializeModel,
  deserializeModel,
  type SerializedQuantumModel,
  type VariationalQuantumClassifier,
  type QuantumGenerativeAdversarialNetwork,
  type QuantumAutoencoder
} from '@/utils/quantumMLPrimitives';

interface SavedModel {
  id: string;
  name: string;
  description: string;
  model: VariationalQuantumClassifier | QuantumGenerativeAdversarialNetwork | QuantumAutoencoder;
  serializedData: SerializedQuantumModel;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  performance?: {
    accuracy?: number;
    loss?: number;
    trainingTime?: number;
  };
}

interface QuantumMLModelManagerProps {
  currentModel?: VariationalQuantumClassifier | QuantumGenerativeAdversarialNetwork | QuantumAutoencoder;
  onModelLoad?: (model: VariationalQuantumClassifier | QuantumGenerativeAdversarialNetwork | QuantumAutoencoder) => void;
  performanceMetrics?: {
    accuracy?: number;
    loss?: number;
    trainingTime?: number;
  };
}

const QuantumMLModelManager: React.FC<QuantumMLModelManagerProps> = ({
  currentModel,
  onModelLoad,
  performanceMetrics
}) => {
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load models from localStorage on mount
  React.useEffect(() => {
    const loadSavedModels = () => {
      try {
        const saved = localStorage.getItem('quantum-ml-models');
        if (saved) {
          const parsedModels = JSON.parse(saved).map((model: any) => ({
            ...model,
            createdAt: new Date(model.createdAt),
            lastModified: new Date(model.lastModified)
          }));
          setSavedModels(parsedModels);
        }
      } catch (error) {
        console.error('Failed to load saved models:', error);
      }
    };

    loadSavedModels();
  }, []);

  // Save models to localStorage whenever savedModels changes
  React.useEffect(() => {
    try {
      localStorage.setItem('quantum-ml-models', JSON.stringify(savedModels));
    } catch (error) {
      console.error('Failed to save models to localStorage:', error);
    }
  }, [savedModels]);

  // Save current model
  const saveCurrentModel = () => {
    if (!currentModel) {
      toast.error('No model to save');
      return;
    }

    const modelName = prompt('Enter a name for the model:');
    if (!modelName) return;

    const description = prompt('Enter a description (optional):') || '';

    try {
      const serializedData = serializeModel(currentModel, description);

      const newModel: SavedModel = {
        id: Date.now().toString(),
        name: modelName,
        description,
        model: currentModel,
        serializedData,
        createdAt: new Date(),
        lastModified: new Date(),
        tags: [],
        performance: performanceMetrics
      };

      setSavedModels(prev => [...prev, newModel]);
      toast.success('Model saved successfully');
    } catch (error) {
      console.error('Failed to save model:', error);
      toast.error('Failed to save model');
    }
  };

  // Load a saved model
  const loadModel = (savedModel: SavedModel) => {
    try {
      const loadedModel = deserializeModel(savedModel.serializedData);
      setSelectedModel(savedModel);

      if (onModelLoad) {
        onModelLoad(loadedModel);
      }

      toast.success(`Model "${savedModel.name}" loaded successfully`);
    } catch (error) {
      console.error('Failed to load model:', error);
      toast.error('Failed to load model');
    }
  };

  // Delete a saved model
  const deleteModel = (modelId: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      setSavedModels(prev => prev.filter(model => model.id !== modelId));
      if (selectedModel?.id === modelId) {
        setSelectedModel(null);
      }
      toast.success('Model deleted');
    }
  };

  // Export model to file
  const exportModel = (model: SavedModel) => {
    try {
      const blob = new Blob([JSON.stringify(model.serializedData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name.replace(/\s+/g, '_')}_model.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Model exported successfully');
    } catch (error) {
      toast.error('Failed to export model');
    }
  };

  // Import model from file
  const importModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate the imported data
        if (!data.type || !data.config || !data.parameters) {
          throw new Error('Invalid model file format');
        }

        const modelName = prompt('Enter a name for the imported model:');
        if (!modelName) return;

        const description = prompt('Enter a description (optional):') || '';

        // Deserialize to validate
        const loadedModel = deserializeModel(data);

        const newModel: SavedModel = {
          id: Date.now().toString(),
          name: modelName,
          description,
          model: loadedModel,
          serializedData: data,
          createdAt: new Date(),
          lastModified: new Date(),
          tags: ['imported']
        };

        setSavedModels(prev => [...prev, newModel]);
        toast.success('Model imported successfully');
      } catch (error) {
        console.error('Failed to import model:', error);
        toast.error('Failed to import model: Invalid file format');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Duplicate a model
  const duplicateModel = (model: SavedModel) => {
    const newName = prompt('Enter a name for the duplicated model:', `${model.name} (Copy)`);
    if (!newName) return;

    const duplicatedModel: SavedModel = {
      ...model,
      id: Date.now().toString(),
      name: newName,
      createdAt: new Date(),
      lastModified: new Date(),
      tags: [...model.tags, 'duplicated']
    };

    setSavedModels(prev => [...prev, duplicatedModel]);
    toast.success('Model duplicated successfully');
  };

  // Edit model metadata
  const startEditing = (model: SavedModel) => {
    setSelectedModel(model);
    setEditForm({
      name: model.name,
      description: model.description,
      tags: model.tags.join(', ')
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedModel) return;

    const updatedModel: SavedModel = {
      ...selectedModel,
      name: editForm.name,
      description: editForm.description,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      lastModified: new Date()
    };

    setSavedModels(prev => prev.map(model =>
      model.id === selectedModel.id ? updatedModel : model
    ));

    setIsEditing(false);
    setSelectedModel(updatedModel);
    toast.success('Model updated successfully');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({ name: '', description: '', tags: '' });
  };

  // Get model type display name
  const getModelTypeDisplay = (type: string) => {
    switch (type) {
      case 'VQC': return 'Variational Quantum Classifier';
      case 'QGAN': return 'Quantum GAN';
      case 'QAE': return 'Quantum Autoencoder';
      default: return type;
    }
  };

  // Get performance color
  const getPerformanceColor = (accuracy?: number) => {
    if (!accuracy) return 'text-muted-foreground';
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Quantum ML Model Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Save, load, and manage your trained quantum machine learning models.
            Export models for sharing or import models from others.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="saved" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Saved Models
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Current Model
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import/Export
          </TabsTrigger>
        </TabsList>

        {/* Saved Models */}
        <TabsContent value="saved" className="space-y-6">
          {savedModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedModels.map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getModelTypeDisplay(model.serializedData.type)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(model)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateModel(model)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteModel(model.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {model.description || 'No description'}
                    </p>

                    {model.performance && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            Acc: <span className={getPerformanceColor(model.performance.accuracy)}>
                              {model.performance.accuracy ? (model.performance.accuracy * 100).toFixed(1) : 'N/A'}%
                            </span>
                          </span>
                        </div>
                        {model.performance.trainingTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {(model.performance.trainingTime / 1000).toFixed(1)}s
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {model.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => loadModel(model)}
                        className="flex-1"
                        size="sm"
                      >
                        Load
                      </Button>
                      <Button
                        onClick={() => exportModel(model)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {model.createdAt.toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Models</h3>
                <p className="text-muted-foreground mb-4">
                  Train and save your first quantum ML model to see it here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Current Model */}
        <TabsContent value="current" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Current Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentModel ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Model Type</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentModel.constructor.name}
                      </p>
                    </div>

                    {performanceMetrics && (
                      <div>
                        <h3 className="font-semibold mb-2">Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {performanceMetrics.accuracy !== undefined && (
                            <div>
                              <p className="text-sm text-muted-foreground">Accuracy</p>
                              <p className="text-lg font-semibold text-green-600">
                                {(performanceMetrics.accuracy * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {performanceMetrics.trainingTime && (
                            <div>
                              <p className="text-sm text-muted-foreground">Training Time</p>
                              <p className="text-lg font-semibold">
                                {(performanceMetrics.trainingTime / 1000).toFixed(1)}s
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button onClick={saveCurrentModel} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Current Model
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active model</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Train a model in the Quantum ML Playground to save it here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Form */}
            {isEditing && selectedModel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Edit Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-name">Name</Label>
                    <Input
                      id="model-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Model name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-description">Description</Label>
                    <Textarea
                      id="model-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Model description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-tags">Tags (comma-separated)</Label>
                    <Input
                      id="model-tags"
                      value={editForm.tags}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="quantum, classification, vqc"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveEdit} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={cancelEdit} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Import/Export */}
        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-file">Select Model File</Label>
                  <Input
                    id="model-file"
                    type="file"
                    accept=".json"
                    onChange={importModel}
                    ref={fileInputRef}
                  />
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Import quantum ML models saved as JSON files. The file should contain
                    the model architecture, parameters, and metadata.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Export Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Models
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export your trained models to share with others or backup your work.
                  Models are saved in JSON format with all necessary information to recreate them.
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold">Export Options</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Individual model export from the saved models list</li>
                    <li>• Includes model architecture and trained parameters</li>
                    <li>• Compatible with other Quantum ML tools</li>
                    <li>• Human-readable JSON format</li>
                  </ul>
                </div>

                {savedModels.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">
                      {savedModels.length} model{savedModels.length !== 1 ? 's' : ''} available for export
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use the export button next to each saved model to download it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Model Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Model Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{savedModels.length}</div>
                  <div className="text-sm text-muted-foreground">Total Models</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {savedModels.filter(m => m.serializedData.type === 'VQC').length}
                  </div>
                  <div className="text-sm text-muted-foreground">VQCs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {savedModels.filter(m => m.serializedData.type === 'QGAN').length}
                  </div>
                  <div className="text-sm text-muted-foreground">QGANs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {savedModels.filter(m => m.serializedData.type === 'QAE').length}
                  </div>
                  <div className="text-sm text-muted-foreground">QAEs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantumMLModelManager;