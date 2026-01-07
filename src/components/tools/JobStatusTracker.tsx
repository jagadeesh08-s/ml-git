import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useIBMQuantum } from '@/contexts/IBMQuantumContext';
import { toast } from 'sonner';

interface JobStatusTrackerProps {
  compact?: boolean;
  showHistory?: boolean;
}

export const JobStatusTracker: React.FC<JobStatusTrackerProps> = ({
  compact = false,
  showHistory = true
}) => {
  const { jobs, currentJob, cancelJob, isLoading } = useIBMQuantum();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Activity className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <Square className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Quantum Jobs</span>
        </div>

        {currentJob ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{currentJob.backendId}</span>
                <span className="font-medium">{currentJob.progress}%</span>
              </div>
              <Progress value={currentJob.progress} className="h-1.5" />
            </div>
            <Badge variant="outline" className={getStatusColor(currentJob.status)}>
              {currentJob.status}
            </Badge>
          </div>
        ) : (
          <Badge variant="secondary">No active jobs</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Quantum Job Status
          {jobs.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {jobs.filter(j => j.status === 'running').length} running
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Job */}
        <AnimatePresence>
          {currentJob && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-primary/20 rounded-lg p-4 bg-primary/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-medium">Current Job</span>
                </div>
                <Badge className={getStatusColor(currentJob.status)}>
                  {currentJob.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Backend:</span>
                    <div className="font-medium">{currentJob.backendId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shots:</span>
                    <div className="font-medium">{currentJob.shots.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <div className="font-medium">{formatTime(currentJob.submittedAt)}</div>
                  </div>
                  {currentJob.estimatedTime && (
                    <div>
                      <span className="text-muted-foreground">Est. Time:</span>
                      <div className="font-medium">{formatDuration(currentJob.submittedAt, new Date(Date.now() + currentJob.estimatedTime * 1000))}</div>
                    </div>
                  )}
                </div>

                {currentJob.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentJob.progress}%</span>
                    </div>
                    <Progress value={currentJob.progress} className="h-2" />
                  </div>
                )}

                {currentJob.status === 'running' && (
                  <Button
                    onClick={() => handleCancelJob(currentJob.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Cancel Job
                  </Button>
                )}

                {currentJob.result && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Job completed successfully! Results available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job History */}
        {showHistory && jobs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Recent Jobs</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {jobs.slice(0, 10).map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedJob === job.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium text-sm">{job.backendId}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.shots.toLocaleString()} shots • {formatTime(job.submittedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(job.status)}`}>
                        {job.status}
                      </Badge>
                      {job.status === 'running' && (
                        <div className="w-12">
                          <Progress value={job.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedJob === job.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Job ID:</span>
                            <div className="font-mono text-xs break-all">{job.id}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-medium">
                              {job.completedAt
                                ? formatDuration(job.submittedAt, job.completedAt)
                                : formatDuration(job.submittedAt)
                              }
                            </div>
                          </div>
                        </div>

                        {job.result && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                            <div className="font-medium mb-1">Results:</div>
                            <div className="space-y-1">
                              {Object.entries(job.result.counts).slice(0, 3).map(([state, count]) => (
                                <div key={state} className="flex justify-between">
                                  <span className="font-mono">|{state}⟩</span>
                                  <span>{count} shots</span>
                                </div>
                              ))}
                              {Object.keys(job.result.counts).length > 3 && (
                                <div className="text-muted-foreground">...and {Object.keys(job.result.counts).length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {job.error && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">{job.error}</AlertDescription>
                          </Alert>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No quantum jobs yet</p>
            <p className="text-sm">Submit your first circuit to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};