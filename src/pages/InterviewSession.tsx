import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { useInterview } from '@/context/InterviewContext';
import { analyzeAnswer } from '@/utils/interviewAnalysisService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Send, Loader2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Define types
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentInterview } = useInterview();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [codeSolution, setCodeSolution] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const editorRef = useRef<any>(null);

  // Speech recognition hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (id) {
      loadInterview(id);
    }
    if (!browserSupportsSpeechRecognition) {
      console.log("Browser doesn't support speech recognition.");
    }
  }, [id, browserSupportsSpeechRecognition]);

  useEffect(() => {
    // Update currentAnswer with the transcript when voice is enabled
    if (isVoiceEnabled) {
      setCurrentAnswer(transcript);
    }
  }, [transcript, isVoiceEnabled]);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const toggleVoiceInput = () => {
    if (!isVoiceEnabled) {
      startListening();
    } else {
      stopListening();
      resetTranscript();
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const loadInterview = async (interviewId: string) => {
    try {
      const response = await fetch(`/api/getInterviewQuestions?interviewId=${interviewId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
        setMessages([{ role: "assistant", content: `First question: ${data.questions[0]}` }]);
      } else {
        console.error('Invalid data format for questions:', data);
        toast.error('Failed to load interview questions.');
      }
    } catch (error: any) {
      console.error('Error loading interview:', error);
      toast.error(error.message || 'Failed to load interview questions.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAnswer.trim() && !codeSolution.trim()) {
      toast.error("Please provide an answer or code solution before submitting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get any voice input and combine with typed answer
      let fullAnswer = currentAnswer;
      
      // If there's code, format it as part of the answer
      if (codeSolution.trim()) {
        fullAnswer += `\n\nCode Solution:\n\`\`\`${selectedLanguage}\n${codeSolution}\n\`\`\``;
      }
      
      // Add the user's answer to the messages
      setAnswers([...answers, fullAnswer]);
      setMessages([...messages, { role: "user", content: fullAnswer }]);
      
      // Send the answer for analysis
      const analysis = await analyzeAnswer(
        currentQuestion,
        fullAnswer,
        currentInterview?.role_type || "Software Developer",
        currentInterview?.language || "JavaScript"
      );
      
      // Process analysis result
      const score = typeof analysis.score === 'number' ? analysis.score : 70;
      const feedbackMessage = `${analysis.feedback}\n\nStrengths:\n${analysis.strengths.map(s => `- ${s}`).join('\n')}\n\nAreas to improve:\n${analysis.weaknesses.map(w => `- ${w}`).join('\n')}`;
      
      // Update scores array with new score
      setScores([...scores, score]);
      
      // Display feedback
      setMessages(prev => [...prev, { role: "assistant", content: feedbackMessage }]);
      
      // Clear inputs
      setCurrentAnswer("");
      setCodeSolution("");
      resetTranscript();
      
      // Move to next question if available
      if (questionIndex < questions.length - 1) {
        // Get the next question ready
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        setCurrentQuestion(questions[nextIndex]);
        
        // Add the next question to the messages
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `Next question: ${questions[nextIndex]}` 
        }]);
      } else {
        // This was the last question
        setIsCompleted(true);
        
        // Add completion message
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "You have completed all questions! Click 'End Interview' to see your results." 
        }]);
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      toast.error("Failed to process your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndInterview = () => {
    if (id) {
      navigate(`/interview/results/${id}`);
    } else {
      toast.error("Interview ID is missing.");
    }
  };

  const getEditorValue = () => {
    if (editorRef.current) {
      setCodeSolution(editorRef.current.getValue());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Interview Session</CardTitle>
            <CardDescription>Answer the questions to the best of your ability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages Display */}
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div key={index} className={`p-3 rounded-md ${message.role === 'user' ? 'bg-muted' : 'bg-secondary'}`}>
                  <p className="text-sm font-medium">{message.role === 'user' ? 'You' : 'AI'}:</p>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Question and Answer Section */}
            {!isCompleted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="question">Question {questionIndex + 1}/{questions.length}</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion}
                    readOnly
                    className="bg-muted/50 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="answer">Your Answer</Label>
                  <Textarea
                    id="answer"
                    placeholder="Enter your answer here"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="resize-none"
                  />
                </div>

                {browserSupportsSpeechRecognition ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleVoiceInput}
                    className="w-full relative"
                    disabled={listening}
                  >
                    {listening ? (
                      <>
                        Listening...
                        <Loader2 className="absolute right-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        {isVoiceEnabled ? "Disable Voice Input" : "Enable Voice Input"}
                        <Mic className="absolute right-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Voice input not supported
                  </Badge>
                )}

                <div>
                  <Label>Code Solution (Optional)</Label>
                  <Select onValueChange={setSelectedLanguage} defaultValue={selectedLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="ruby">Ruby</SelectItem>
                      <SelectItem value="kotlin">Kotlin</SelectItem>
                      <SelectItem value="swift">Swift</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                  <Editor
                    height="200px"
                    defaultLanguage={selectedLanguage}
                    defaultValue=""
                    theme="light"
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    onChange={getEditorValue}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      Submitting...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-500" />
                <p className="text-lg font-semibold">Congratulations! You have completed the interview.</p>
                <Button onClick={handleEndInterview} className="mt-4">
                  End Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
