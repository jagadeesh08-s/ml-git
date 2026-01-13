import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Key,
  Server,
  Activity,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Cpu,
  Loader2,
  ExternalLink,
  Settings,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import { useIBMQuantum, IBMQuantumBackend, QuantumJob } from '@/contexts/IBMQuantumContext';
import { toast } from 'sonner';

interface IBMQuantumConnectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IBMQuantumConnection: React.FC<IBMQuantumConnectionProps> = ({
  isOpen,
  onClose
}) => {
  const {
    isAuthenticated,
    token,
    setToken,
    backends,
    selectedBackend,
    setSelectedBackend,
    refreshBackends,
    jobs,
    currentJob,
    submitJob,
    cancelJob,
    isLoading,
    error,
    isFallback,
    getJobResult,
    isLocked,
    setIsLocked
  } = useIBMQuantum();

  const [activeTab, setActiveTab] = useState<'auth' | 'backends' | 'jobs'>('auth');
  const [simulationMode, setSimulationMode] = useState<'wasm' | 'local' | 'ibm'>('wasm');
  const [testCircuit, setTestCircuit] = useState('');
  const [testShots, setTestShots] = useState(1024);

  // No auto-switch to backends tab just based on auth
  // We handle it explicitly after validation

  const [inputToken, setInputToken] = useState('');

  // Sync input with global token on mount
  useEffect(() => {
    if (token) setInputToken(token);
  }, [token]);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken?.trim()) {
      const newToken = inputToken.trim();

      // Show loading toast or indicator? refreshBackends sets global isLoading
      const isValid = await refreshBackends(newToken);

      if (isValid) {
        setToken(newToken);
        toast.success('IBM Quantum token verified and saved');
        setActiveTab('backends');
      } else {
        toast.error('Invalid IBM Quantum token or connection failed');
        // Don't save to global state if invalid
        // Token might still be in local input
      }
    }
  };

  const handleTestJob = async () => {
    if (!selectedBackend) {
      toast.error('Please select a backend first');
      return;
    }

    try {
      // Create a simple test circuit
      const circuit = {
        numQubits: 2,
        gates: [
          { name: 'H', qubits: [0] },
          { name: 'CNOT', qubits: [0, 1] }
        ]
      };

      await submitJob(circuit, testShots, selectedBackend.id);
      toast.success('Test job submitted successfully');
    } catch (error) {
      toast.error('Failed to submit test job');
    }
  };

  const getBackendStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBackendIcon = (type: string) => {
    return type === 'hardware' ? <Server className="w-4 h-4" /> : <Cpu className="w-4 h-4" />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            IBM Quantum Connection
          </DialogTitle>
          <DialogDescription>
            Manage your connection to IBM Quantum services and view job status.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'auth' | 'backends' | 'jobs')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="backends" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Backends
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Connect to IBM Quantum to run circuits on real quantum hardware.
                Get your API token from{' '}
                <a
                  href="https://quantum-computing.ibm.com/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  IBM Quantum Experience
                </a>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">IBM Quantum API Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    type="password"
                    placeholder="Enter your IBM Quantum token"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputToken?.trim() || isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    {isLoading ? 'Verifying...' : 'Save & Connect'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your token is stored locally and never sent to our servers.
                </p>
              </div>
            </form>

            {isAuthenticated && (
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Successfully authenticated with IBM Quantum!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Simulation Mode</h3>
                <Badge variant="outline" className="text-xs">
                  {simulationMode === 'wasm' ? 'WebAssembly' :
                    simulationMode === 'local' ? 'Local Simulator' : 'IBM Quantum'}
                </Badge>
              </div>

              <Select value={simulationMode} onValueChange={(value: 'wasm' | 'local' | 'ibm') => setSimulationMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wasm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium">WebAssembly Simulator</div>
                        <div className="text-xs text-muted-foreground">Fast, local simulation</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium">Local Simulator</div>
                        <div className="text-xs text-muted-foreground">Advanced local simulation</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ibm">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-medium">IBM Quantum Hardware</div>
                        <div className="text-xs text-muted-foreground">{isAuthenticated ? 'Authenticated' : 'Requires Token'}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {simulationMode === 'wasm' && (
                <div className="flex items-center gap-2 text-green-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Using optimized WebAssembly simulation</span>
                </div>
              )}

              {simulationMode === 'local' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm">Using advanced local quantum simulator</span>
                </div>
              )}

              {simulationMode === 'ibm' && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Connected to IBM Quantum hardware</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="backends" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Backends</h3>
              <Button onClick={() => refreshBackends()} disabled={isLoading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isFallback && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-4">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                  <strong>Connection Offline:</strong> Displaying fallback simulators. Real backend data is unavailable.
                </AlertDescription>
              </Alert>
            )}

            {error && !isFallback && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {backends.map((backend) => (
                <Card
                  key={backend.id}
                  className={`cursor-pointer transition-all ${selectedBackend?.id === backend.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                    }`}
                  onClick={() => setSelectedBackend(backend)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getBackendIcon(backend.type)}
                        <div>
                          <CardTitle className="text-base">{backend.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{backend.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getBackendStatusColor(backend.status)}`} />
                        <Badge variant={backend.status === 'online' ? 'default' : 'secondary'}>
                          {backend.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Qubits:</span>
                        <div className="font-medium">{backend.numQubits}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Shots:</span>
                        <div className="font-medium">{backend.maxShots.toLocaleString()}</div>
                      </div>
                      {backend.queueDepth !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Queue:</span>
                          <div className="font-medium">{backend.queueDepth}</div>
                        </div>
                      )}
                      {backend.pendingJobs !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Pending:</span>
                          <div className="font-medium">{backend.pendingJobs}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!isLoading && backends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No backends found</p>
                  <Button variant="link" onClick={() => refreshBackends()} className="mt-2">
                    Try Refreshing
                  </Button>
                </div>
              )}
            </div>

            {selectedBackend && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" />
                    Selected Backend: {selectedBackend.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{selectedBackend.type}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-medium capitalize">{selectedBackend.status}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Backend Lock:</span>
                      <Badge variant={isLocked ? "default" : "outline"} className={isLocked ? "bg-amber-500 hover:bg-amber-600" : ""}>
                        {isLocked ? "LOCKED" : "UNLOCKED"}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => setIsLocked(!isLocked)}
                      variant={isLocked ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      {isLocked ? "Unlock Selection" : "Lock Selection"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Test Circuit</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter shots (e.g., 1024)"
                        type="number"
                        value={testShots}
                        onChange={(e) => setTestShots(parseInt(e.target.value) || 1024)}
                        min={1}
                        max={selectedBackend.maxShots}
                      />
                      <Button onClick={handleTestJob} disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Test Job
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quantum Jobs</h3>
              <Badge variant="outline">{jobs.length} total</Badge>
            </div>

            {currentJob && (
              <Card className="border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Activity className="w-5 h-5" />
                    Current Job
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentJob.progress}%</span>
                    </div>
                    <Progress value={currentJob.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Backend:</span>
                      <div className="font-medium">{currentJob.backendId}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shots:</span>
                      <div className="font-medium">{currentJob.shots}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                        {currentJob.status}
                      </Badge>
                    </div>
                    {currentJob.estimatedTime && (
                      <div>
                        <span className="text-muted-foreground">Est. Time:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(currentJob.estimatedTime)}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentJob.status === 'running' && (
                    <Button
                      onClick={() => cancelJob(currentJob.id)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Cancel Job
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'running' ? 'bg-blue-500' :
                            job.status === 'failed' ? 'bg-red-500' :
                              'bg-gray-500'
                          }`} />
                        <div>
                          <div className="font-medium text-sm">{job.backendId}</div>
                          <div className="text-xs text-muted-foreground">
                            {job.shots} shots • {job.submittedAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                            job.status === 'running' ? 'secondary' :
                              job.status === 'failed' ? 'destructive' :
                                'outline'
                        }>
                          {job.status}
                        </Badge>
                        {job.status === 'running' && (
                          <div className="w-16">
                            <Progress value={job.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Results Visualization */}
                    {job.status === 'completed' && job.result && job.result.counts && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Activity className="w-3 h-3" />
                          Results Analysis
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(job.result.counts)
                            .sort((a, b) => b[1] - a[1]) // Sort by count descending
                            .slice(0, 8) // Show top 8 states
                            .map(([state, count]) => {
                              const probability = (count / job.shots) * 100;
                              return (
                                <div key={state} className="flex items-center gap-2 text-xs">
                                  <div className="w-12 font-mono font-medium text-right">{state}</div>
                                  <div className="flex-1 h-5 bg-secondary/50 rounded-sm overflow-hidden relative group">
                                    <div
                                      className="h-full bg-primary/80 transition-all duration-500 relative"
                                      style={{ width: `${probability}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-start pl-2 text-[10px] text-foreground/70 font-medium">
                                      {count} counts
                                    </div>
                                  </div>
                                  <div className="w-12 text-right font-mono">{probability.toFixed(1)}%</div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 justify-end">
                      {job.status !== 'completed' && job.status !== 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => getJobResult(job.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Check Status
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
};