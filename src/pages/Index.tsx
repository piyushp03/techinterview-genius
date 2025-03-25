
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInterview } from '@/context/InterviewContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InterviewPanel from '@/components/InterviewPanel';
import CodeEditor from '@/components/CodeEditor';
import ProfileSelector from '@/components/ProfileSelector';
import ResumeUploader from '@/components/ResumeUploader';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Bot, Cpu, Code, File, Columns, Brain, ChevronRight, Microphone, Settings } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const { 
    isActive, 
    session, 
    startSession, 
    endSession, 
    selectedRole, 
    selectedLanguage,
    selectedCategory,
    setCategory,
    processResume,
  } = useInterview();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleStartSession = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    startSession({
      role: selectedRole,
      language: selectedLanguage,
      category: selectedCategory,
    });
  };

  const handleCategoryChange = (category: any) => {
    setCategory(category);
  };

  const interviewCategories = [
    { id: 'algorithms', label: 'Algorithms & Data Structures', icon: Cpu },
    { id: 'system-design', label: 'System Design', icon: Columns },
    { id: 'behavioral', label: 'Behavioral', icon: Brain },
    { id: 'language-specific', label: 'Language Specific', icon: Code },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {isFullScreen ? (
          <div className="fixed inset-0 z-40 bg-background">
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <InterviewPanel isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
              <CodeEditor />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section id="hero" className="py-16 px-4 text-center relative overflow-hidden">
              <div className="container mx-auto relative z-10">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    AI-Powered Technical Interview Practice
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Prepare for your next tech interview with our intelligent AI interviewer. Get personalized questions based on your skills and role.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                    <Button size="lg" className="btn-primary" onClick={handleStartSession}>
                      {isActive ? 'Resume Interview' : 'Start Practicing Now'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    <a href="#how-it-works">
                      <Button variant="outline" size="lg">
                        Learn More
                      </Button>
                    </a>
                  </div>
                </div>
                
                {isAuthenticated && (
                  <div className="text-muted-foreground text-sm">
                    {user?.role === 'guest' ? 'Signed in as Guest' : `Signed in as ${user?.name}`}
                  </div>
                )}
              </div>
              
              <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-background dark:from-blue-950/20 dark:to-background"></div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[10%] w-[200%] aspect-square rounded-full bg-blue-100/60 dark:bg-blue-900/20 blur-3xl"></div>
              </div>
            </section>

            {/* Feature Cards */}
            <section id="features" className="py-16 px-4">
              <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="glass-card p-6 card-hover">
                    <Bot className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">AI Interviewer</h3>
                    <p className="text-muted-foreground">
                      Intelligent interview simulation with contextual questions and real-time feedback.
                    </p>
                  </div>
                  
                  <div className="glass-card p-6 card-hover">
                    <Microphone className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">Speech Recognition</h3>
                    <p className="text-muted-foreground">
                      Speak your answers naturally with real-time speech-to-text technology.
                    </p>
                  </div>
                  
                  <div className="glass-card p-6 card-hover">
                    <Code className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">Code Editor</h3>
                    <p className="text-muted-foreground">
                      Practice coding challenges with our built-in editor supporting multiple languages.
                    </p>
                  </div>
                  
                  <div className="glass-card p-6 card-hover">
                    <File className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">Resume Analysis</h3>
                    <p className="text-muted-foreground">
                      Upload your resume for personalized questions based on your experience.
                    </p>
                  </div>
                  
                  <div className="glass-card p-6 card-hover">
                    <Settings className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">Customizable Roles</h3>
                    <p className="text-muted-foreground">
                      Select from various tech roles for role-specific interview questions.
                    </p>
                  </div>
                  
                  <div className="glass-card p-6 card-hover">
                    <Brain className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-medium mb-2">Performance Analytics</h3>
                    <p className="text-muted-foreground">
                      Track your improvement over time with detailed session analytics.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Interview Setup */}
            <section id="interview-setup" className="py-16 px-4 bg-muted/30">
              <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">Configure Your Interview</h2>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Customize your interview session to match your career goals and get targeted practice.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium">Select Role</h3>
                      <ProfileSelector />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium">Interview Category</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {interviewCategories.map((category) => (
                          <div
                            key={category.id}
                            className={`flex items-center gap-3 p-3 glass-card cursor-pointer transition-all ${
                              selectedCategory === category.id
                                ? 'ring-2 ring-primary'
                                : 'hover:-translate-y-1 hover:shadow-md'
                            }`}
                            onClick={() => handleCategoryChange(category.id)}
                          >
                            <category.icon className="h-5 w-5 text-primary" />
                            <span>{category.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <ResumeUploader onResumeProcessed={processResume} />
                    
                    <div className="mt-6">
                      {isActive ? (
                        <div className="flex gap-4">
                          <Button className="w-full btn-primary" onClick={toggleFullScreen}>
                            Continue Interview
                          </Button>
                          <Button variant="outline" className="flex-shrink-0" onClick={endSession}>
                            End Session
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full btn-primary" onClick={handleStartSession}>
                          Start Interview
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 h-[600px] overflow-hidden">
                    <div className="h-full grid grid-rows-2 gap-4">
                      <InterviewPanel isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
                      <CodeEditor />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-16 px-4">
              <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="text-xl font-medium">Configure Your Interview</h3>
                    <p className="text-muted-foreground">
                      Select your target role, preferred programming language, and interview focus area.
                    </p>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="text-xl font-medium">Practice with AI</h3>
                    <p className="text-muted-foreground">
                      Engage with our AI interviewer through text or voice. Solve coding challenges in real-time.
                    </p>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="text-xl font-medium">Improve & Analyze</h3>
                    <p className="text-muted-foreground">
                      Get instant feedback on your responses and track your progress over time.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      
      {!isFullScreen && <Footer />}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
