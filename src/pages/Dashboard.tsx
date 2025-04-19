
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Brain, MessageSquare, FileText, History, Settings, Mic, Code } from 'lucide-react';
import DailyChallengeCard from '@/components/DailyChallengeCard';

const Dashboard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Interview Practice',
      description: 'Start a new mock interview with AI',
      icon: <Brain className="h-10 w-10 text-primary" />,
      action: () => navigate('/new-interview'),
    },
    {
      title: 'AI Voice Interviewer',
      description: 'Practice with voice-based AI interviewer',
      icon: <Mic className="h-10 w-10 text-purple-500" />,
      action: () => navigate('/voice-interview'),
    },
    {
      title: 'Daily Coding Challenge',
      description: 'Solve the daily coding problem to improve skills',
      icon: <Code className="h-10 w-10 text-blue-500" />,
      action: () => navigate('/daily-challenge'),
    },
    {
      title: 'Custom Questions',
      description: 'Create and manage your own questions',
      icon: <MessageSquare className="h-10 w-10 text-indigo-500" />,
      action: () => navigate('/questions'),
    },
    {
      title: 'Resume Analysis',
      description: 'Get AI feedback on your resume',
      icon: <FileText className="h-10 w-10 text-green-500" />,
      action: () => navigate('/resume'),
    },
    {
      title: 'Interview History',
      description: 'Review your past interview sessions',
      icon: <History className="h-10 w-10 text-amber-500" />,
      action: () => navigate('/history'),
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account information',
      icon: <Settings className="h-10 w-10 text-slate-500" />,
      action: () => navigate('/profile'),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.email?.split('@')[0] || 'User'}</h1>
          <p className="text-muted-foreground mt-2">
            What would you like to do today?
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Daily Challenge Card */}
          <DailyChallengeCard />
          
          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {item.icon}
                  <CardTitle>{item.title}</CardTitle>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={item.action} className="w-full">
                  Go to {item.title}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
