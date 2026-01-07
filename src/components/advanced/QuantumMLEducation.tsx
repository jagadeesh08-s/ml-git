import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Brain,
  TrendingUp,
  Layers,
  Cpu,
  Network,
  Database,
  BarChart3,
  CheckCircle,
  Info,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause
} from 'lucide-react';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  content: {
    overview: string;
    keyConcepts: string[];
    mathematical: string;
    applications: string[];
    examples: string[];
    quiz?: {
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }[];
  };
}

const QuantumMLEducation: React.FC = () => {
  const [currentTopic, setCurrentTopic] = useState<string>('feature-maps');
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const educationalContent: EducationalContent[] = [
    {
      id: 'feature-maps',
      title: 'Quantum Feature Maps',
      description: 'Learn how to encode classical data into quantum states',
      difficulty: 'beginner',
      category: 'Data Encoding',
      content: {
        overview: `Feature maps are crucial for quantum machine learning as they determine how classical data is encoded into quantum states. The choice of feature map can significantly impact the performance of quantum algorithms.`,
        keyConcepts: [
          'Data encoding strategies',
          'Angle encoding vs amplitude encoding',
          'Entangling gates in feature maps',
          'Hardware-efficient ansätze'
        ],
        mathematical: `A feature map φ(x) maps classical data x ∈ ℝⁿ to a quantum state |φ(x)⟩. For angle encoding, each feature xᵢ is encoded as a rotation: |φ(x)⟩ = ∏ᵢ RZ(xᵢ) |0⟩.`,
        applications: [
          'Classification tasks',
          'Regression problems',
          'Kernel methods',
          'Generative modeling'
        ],
        examples: [
          'Z Feature Map: RY rotations on each qubit',
          'ZZ Feature Map: Pairwise feature interactions',
          'Amplitude Encoding: Direct state preparation'
        ],
        quiz: [
          {
            question: 'What is the main purpose of a quantum feature map?',
            options: [
              'To reduce computational complexity',
              'To encode classical data into quantum states',
              'To optimize quantum circuits',
              'To measure quantum states'
            ],
            correct: 1,
            explanation: 'Feature maps encode classical data into quantum states, allowing quantum algorithms to process classical information.'
          }
        ]
      }
    },
    {
      id: 'quantum-kernels',
      title: 'Quantum Kernels',
      description: 'Understanding kernel methods in quantum computing',
      difficulty: 'intermediate',
      category: 'Algorithms',
      content: {
        overview: `Quantum kernels provide a way to compute similarity measures between classical data points using quantum circuits. They can potentially offer quantum advantage for certain machine learning tasks.`,
        keyConcepts: [
          'Kernel trick in quantum computing',
          'Fidelity-based kernels',
          'Projected quantum kernels',
          'Quantum support vector machines'
        ],
        mathematical: `The quantum kernel K(xᵢ, xⱼ) = |⟨φ(xᵢ)|φ(xⱼ)⟩|² measures the similarity between encoded quantum states. This can capture complex patterns that classical kernels cannot.`,
        applications: [
          'Pattern recognition',
          'Classification with SVMs',
          'Clustering algorithms',
          'Dimensionality reduction'
        ],
        examples: [
          'Fidelity Quantum Kernel: Uses quantum state overlap',
          'Projected Kernel: Classical approximation of quantum kernels',
          'Gaussian Kernels: RBF-like quantum implementations'
        ]
      }
    },
    {
      id: 'vqc',
      title: 'Variational Quantum Classifiers',
      description: 'Learn about VQC architecture and training',
      difficulty: 'intermediate',
      category: 'Algorithms',
      content: {
        overview: `Variational Quantum Classifiers (VQCs) combine parameterized quantum circuits with classical optimization to perform classification tasks. They represent a hybrid quantum-classical approach to machine learning.`,
        keyConcepts: [
          'Parameterized quantum circuits',
          'Variational ansätze',
          'Cost function optimization',
          'Measurement strategies'
        ],
        mathematical: `A VQC consists of a feature map U_φ(x) followed by a variational circuit U(θ). The output is obtained by measuring observables: f(x) = ⟨0| U(θ)† U_φ(x)† M U_φ(x) U(θ) |0⟩.`,
        applications: [
          'Binary and multiclass classification',
          'Pattern recognition',
          'Medical diagnosis',
          'Financial modeling'
        ],
        examples: [
          'Basic VQC: Feature map + variational layer',
          'Multi-layer VQC: Stacked variational circuits',
          'Hardware-efficient VQC: NISQ-compatible designs'
        ]
      }
    },
    {
      id: 'qgan',
      title: 'Quantum Generative Adversarial Networks',
      description: 'Explore quantum generative modeling',
      difficulty: 'advanced',
      category: 'Generative Models',
      content: {
        overview: `Quantum GANs extend classical GANs to the quantum domain, using quantum circuits to generate new quantum states or classical data distributions.`,
        keyConcepts: [
          'Generator and discriminator circuits',
          'Adversarial training',
          'Quantum data generation',
          'Nash equilibrium in quantum systems'
        ],
        mathematical: `The quantum GAN minimizes the Jensen-Shannon divergence between real and generated distributions through adversarial training: min_G max_D V(D,G) = E_{x~p_data}[log D(x)] + E_{z~p_z}[log(1-D(G(z)))]`,
        applications: [
          'Quantum state generation',
          'Classical data synthesis',
          'Quantum state preparation',
          'Anomaly detection'
        ],
        examples: [
          'Basic QGAN: Simple generator-discriminator pair',
          'Conditional QGAN: Class-conditional generation',
          'Quantum State GAN: Generating quantum states'
        ]
      }
    },
    {
      id: 'autoencoders',
      title: 'Quantum Autoencoders',
      description: 'Learn about quantum data compression and reconstruction',
      difficulty: 'advanced',
      category: 'Generative Models',
      content: {
        overview: `Quantum autoencoders use quantum circuits to learn compressed representations of quantum data, enabling efficient storage and processing of quantum information.`,
        keyConcepts: [
          'Encoder-decoder architecture',
          'Latent space representation',
          'Quantum data compression',
          'Reconstruction fidelity'
        ],
        mathematical: `The quantum autoencoder minimizes reconstruction error: L = ||ρ - U_decoder(U_encoder(ρ))|| where ρ is the input quantum state and U_encoder, U_decoder are quantum circuits.`,
        applications: [
          'Quantum data compression',
          'Quantum error correction',
          'Feature extraction',
          'Dimensionality reduction'
        ],
        examples: [
          'Basic Quantum Autoencoder',
          'Variational Quantum Autoencoder',
          'Convolutional Quantum Autoencoder'
        ]
      }
    },
    {
      id: 'preprocessing',
      title: 'Quantum Data Preprocessing',
      description: 'Techniques for preparing data for quantum algorithms',
      difficulty: 'beginner',
      category: 'Data Processing',
      content: {
        overview: `Data preprocessing is crucial for quantum machine learning. Classical data must be properly encoded and normalized for quantum algorithms to perform effectively.`,
        keyConcepts: [
          'Data normalization',
          'Feature scaling',
          'Dimensionality reduction',
          'Quantum-compatible encoding'
        ],
        mathematical: `Common preprocessing includes min-max scaling: x' = (x - min)/(max - min), z-score normalization: x' = (x - μ)/σ, and angle encoding: θ = π * x for rotation gates.`,
        applications: [
          'Feature engineering',
          'Data standardization',
          'Outlier handling',
          'Encoding optimization'
        ],
        examples: [
          'Standardization for angle encoding',
          'Min-max scaling for amplitude encoding',
          'PCA for dimensionality reduction'
        ]
      }
    }
  ];

  const currentContent = educationalContent.find(c => c.id === currentTopic);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const markTopicComplete = (topicId: string) => {
    setCompletedTopics(prev => new Set([...prev, topicId]));
    setProgress(prev => ({ ...prev, [topicId]: 100 }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Data Encoding': return <Database className="w-4 h-4" />;
      case 'Algorithms': return <Cpu className="w-4 h-4" />;
      case 'Generative Models': return <Sparkles className="w-4 h-4" />;
      case 'Data Processing': return <BarChart3 className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Quantum Machine Learning Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Comprehensive educational content covering quantum machine learning concepts,
            algorithms, and applications. Learn at your own pace with interactive examples and quizzes.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Topic Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {educationalContent.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setCurrentTopic(topic.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    currentTopic === topic.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(topic.category)}
                    <span className="font-medium text-sm">{topic.title}</span>
                    {completedTopics.has(topic.id) && (
                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                  </div>
                  <Badge className={`text-xs ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </Badge>
                  {progress[topic.id] && (
                    <div className="mt-2">
                      <Progress value={progress[topic.id]} className="h-1" />
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content Display */}
        <div className="lg:col-span-3">
          {currentContent && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="concepts">Concepts</TabsTrigger>
                <TabsTrigger value="math">Mathematics</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      {currentContent.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {currentContent.content.overview}
                    </p>

                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(currentContent.difficulty)}>
                        {currentContent.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {currentContent.category}
                      </Badge>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Learning Objectives:</strong> Understand the core concepts,
                        mathematical foundations, and practical applications of {currentContent.title.toLowerCase()}.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentContent.content.applications.map((app, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{app}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Key Concepts */}
              <TabsContent value="concepts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Key Concepts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentContent.content.keyConcepts.map((concept, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <span className="text-sm leading-relaxed">{concept}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mathematics */}
              <TabsContent value="math" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Mathematical Foundation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                        {currentContent.content.mathematical}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Examples */}
              <TabsContent value="examples" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Practical Examples
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentContent.content.examples.map((example, index) => (
                        <div key={index} className="border-l-4 border-primary/30 pl-4 py-2">
                          <h4 className="font-semibold text-sm mb-1">{example.split(':')[0]}</h4>
                          <p className="text-sm text-muted-foreground">
                            {example.split(':')[1] || example}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz */}
              <TabsContent value="quiz" className="space-y-6">
                {currentContent.content.quiz ? (
                  <div className="space-y-6">
                    {currentContent.content.quiz.map((quizItem, quizIndex) => (
                      <Card key={quizIndex}>
                        <CardHeader>
                          <CardTitle className="text-lg">Question {quizIndex + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="font-medium">{quizItem.question}</p>

                          <div className="space-y-2">
                            {quizItem.options.map((option, optionIndex) => (
                              <button
                                key={optionIndex}
                                onClick={() => {
                                  setQuizAnswers(prev => ({
                                    ...prev,
                                    [`${currentTopic}_${quizIndex}`]: optionIndex
                                  }));
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  quizAnswers[`${currentTopic}_${quizIndex}`] === optionIndex
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-muted/20 border-muted hover:bg-muted/30'
                                }`}
                              >
                                <span className="text-sm">{option}</span>
                              </button>
                            ))}
                          </div>

                          {showQuizResults && quizAnswers[`${currentTopic}_${quizIndex}`] !== undefined && (
                            <Alert className={
                              quizAnswers[`${currentTopic}_${quizIndex}`] === quizItem.correct
                                ? 'border-green-500/20 bg-green-500/10'
                                : 'border-red-500/20 bg-red-500/10'
                            }>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>
                                  {quizAnswers[`${currentTopic}_${quizIndex}`] === quizItem.correct
                                    ? 'Correct!'
                                    : 'Incorrect.'}
                                </strong> {quizItem.explanation}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowQuizResults(!showQuizResults)}
                        variant="outline"
                      >
                        {showQuizResults ? 'Hide Results' : 'Check Answers'}
                      </Button>

                      <Button
                        onClick={() => markTopicComplete(currentTopic)}
                        className="ml-auto"
                      >
                        Mark as Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No quiz available for this topic yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedTopics.size}</div>
              <div className="text-sm text-muted-foreground">Topics Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round((completedTopics.size / educationalContent.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {educationalContent.filter(t => t.difficulty === 'beginner').length}
              </div>
              <div className="text-sm text-muted-foreground">Beginner Topics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {educationalContent.filter(t => t.difficulty === 'advanced').length}
              </div>
              <div className="text-sm text-muted-foreground">Advanced Topics</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantumMLEducation;