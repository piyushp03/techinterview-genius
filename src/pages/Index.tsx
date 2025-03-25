
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, MessageSquare, UserCheck, FileText } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: 'AI-Powered Interviews',
      description: 'Practice with our intelligent AI that adapts to your responses and provides personalized feedback.'
    },
    {
      icon: <UserCheck className="h-10 w-10 text-green-500" />,
      title: 'Role-Specific Questions',
      description: 'Train with questions tailored to frontend, backend, full-stack, DevOps and many other tech roles.'
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-blue-500" />,
      title: 'Custom Question Bank',
      description: 'Add your own questions and answers to focus on areas you want to improve.'
    },
    {
      icon: <FileText className="h-10 w-10 text-amber-500" />,
      title: 'Resume Analysis',
      description: 'Get actionable feedback on your resume to improve your chances of landing an interview.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter max-w-3xl">
              Ace Your Next Tech Interview with AI-Powered Practice
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
              Prepare for technical interviews with realistic AI simulations. Get instant feedback and improve your skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button 
                className="text-lg px-8 py-6"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'} 
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {!isAuthenticated && (
                <Button 
                  variant="outline" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50" id="features">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl">
              Everything you need to prepare for your technical interviews
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16" id="how-it-works">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl">
              A simple process to help you improve your interview skills
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Choose Your Focus</h3>
              <p className="text-muted-foreground">
                Select your target role, programming language, and interview type to get tailored questions.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Practice with AI</h3>
              <p className="text-muted-foreground">
                Engage in realistic interview conversations with our AI interviewer and receive real-time feedback.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Track Your Progress</h3>
              <p className="text-muted-foreground">
                Review your past interviews, focus on areas for improvement, and build confidence for the real thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">Ready to Land Your Dream Tech Job?</h2>
            <p className="max-w-2xl">
              Start practicing today and gain the confidence you need to succeed in your next interview.
            </p>
            <Button 
              variant="secondary" 
              className="mt-4 text-lg px-8 py-6"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Practicing'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
