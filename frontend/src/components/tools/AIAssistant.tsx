import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  Brain,
  Zap,
  BookOpen,
  Code,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentCircuit?: any;
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  currentCircuit,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "👋 Hi! I'm your Quantum AI Assistant. I can help you understand quantum circuits, explain concepts, generate code, and answer questions about quantum computing. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAIReady, setIsAIReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AI model
  useEffect(() => {
    initializeAI();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeAI = async () => {
    try {
      // Dynamic import to avoid issues if not installed
      const { pipeline } = await import('@xenova/transformers');
      setIsAIReady(true);
      toast.success('AI Assistant ready!');
    } catch (error) {
      console.error('Failed to load AI model:', error);
      toast.error('AI model not available. Using fallback responses.');
    }
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      // Import dynamically to handle loading
      const { pipeline } = await import('@xenova/transformers');

      // Create context-aware prompt
      const contextPrompt = createContextPrompt(userMessage);
      const generator = await pipeline('text-generation', 'Xenova/distilgpt2');

      const result = await generator(contextPrompt, {
        max_length: 200,
        temperature: 0.7,
        do_sample: true,
      });

      // Handle different response formats from transformers.js
      let generatedText = '';
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        if (typeof firstResult === 'string') {
          generatedText = firstResult;
        } else if (firstResult && typeof firstResult === 'object') {
          // Try different property names that might exist
          generatedText = (firstResult as any).generated_text ||
                         (firstResult as any).text ||
                         (firstResult as any).output ||
                         String(firstResult);
        }
      }

      return generatedText.replace(contextPrompt, '').trim();
    } catch (error) {
      console.error('AI generation error:', error);
      return getFallbackResponse(userMessage);
    }
  };

  const createContextPrompt = (userMessage: string): string => {
    let context = `You are a helpful Quantum Computing AI Assistant. `;

    if (currentCircuit) {
      context += `The user currently has a quantum circuit with ${currentCircuit.numQubits} qubits and ${currentCircuit.gates?.length || 0} gates. `;
    }

    context += `Please provide a helpful, educational response about quantum computing. `;

    // Add quantum-specific context based on message content
    if (userMessage.toLowerCase().includes('bell') || userMessage.toLowerCase().includes('entangl')) {
      context += `Focus on quantum entanglement and Bell states. `;
    } else if (userMessage.toLowerCase().includes('superposition') || userMessage.toLowerCase().includes('hadamard')) {
      context += `Explain quantum superposition clearly. `;
    } else if (userMessage.toLowerCase().includes('gate') || userMessage.toLowerCase().includes('circuit')) {
      context += `Provide information about quantum gates and circuits. `;
    }

    context += `User question: ${userMessage}`;
    return context;
  };

  const getFallbackResponse = (userMessage: string): string => {
    const responses: { [key: string]: string } = {
      'hello': 'Hello! I\'m here to help you with quantum computing questions. What would you like to know?',
      'bell': 'Bell states are fundamental examples of quantum entanglement. A Bell state like |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 shows how two qubits can be correlated in ways impossible with classical bits.',
      'superposition': 'Quantum superposition allows qubits to exist in multiple states simultaneously. The Hadamard gate creates superposition: H|0⟩ = (|0⟩ + |1⟩)/√2.',
      'gate': 'Quantum gates manipulate qubit states. Common gates include: H (Hadamard) for superposition, X (Pauli-X) for bit flips, and CNOT for entanglement.',
      'circuit': 'Quantum circuits are sequences of quantum gates applied to qubits. They\'re the quantum equivalent of classical algorithms.',
      'help': 'I can help explain quantum concepts, describe what circuits do, suggest improvements, or answer general quantum computing questions!'
    };

    const message = userMessage.toLowerCase();

    for (const [key, response] of Object.entries(responses)) {
      if (message.includes(key)) {
        return response;
      }
    }

    return 'I\'m a Quantum AI Assistant here to help! I can explain quantum concepts, help with circuit understanding, or answer questions about quantum computing. What specific topic interests you?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await generateResponse(inputMessage);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate AI response');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try asking your question again!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    { icon: <Zap className="w-4 h-4" />, text: "What is quantum superposition?" },
    { icon: <Brain className="w-4 h-4" />, text: "Explain Bell state entanglement" },
    { icon: <Code className="w-4 h-4" />, text: "How do quantum gates work?" },
    { icon: <BookOpen className="w-4 h-4" />, text: "What is a quantum circuit?" }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`bg-gradient-to-br from-card to-muted/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-border/50 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border/50 p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, repeatDelay: 1 }
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center border border-primary/30"
                >
                  <Bot className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Quantum AI Assistant
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isAIReady ? '🤖 AI Model Ready' : '⚡ Initializing AI...'}
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-muted/50">
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className={`max-w-[70%] ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                  <Card className={`${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/50 border-border/50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                        <div className="space-y-2">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs opacity-70 ${
                            message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 justify-start"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-muted/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Quick Questions:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question.text)}
                      className="w-full justify-start text-left h-auto py-2 px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-2">
                        {question.icon}
                        <span className="text-xs">{question.text}</span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-border/50 bg-muted/20">
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about quantum computing..."
                  className="min-h-[44px] max-h-32 resize-none border-primary/30 focus:border-primary/60"
                  disabled={isLoading}
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="lg"
                  className="h-11 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAIReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isAIReady ? 'AI Ready' : 'Loading AI Model...'}</span>
              </div>
              {currentCircuit && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Circuit Context Active
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;