
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, CheckCircle, Code, Layers } from 'lucide-react';

const AIInterviewer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Interview types
  const interviewTypes = [
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Practice coding challenges and technical questions',
      icon: <Code className="h-8 w-8 text-primary" />
    },
    {
      id: 'behavioral',
      title: 'Behavioral Interview',
      description: 'Practice answering soft skills and situational questions',
      icon: <CheckCircle className="h-8 w-8 text-green-500" />
    },
    {
      id: 'system',
      title: 'System Design',
      description: 'Practice designing scalable systems and architectures',
      icon: <Layers className="h-8 w-8 text-blue-500" />
    }
  ];

  const startNewInterview = async (type: string) => {
    setIsCreating(true);
    
    try {
      // Create a new interview session in the database
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user?.id,
          role_type: type === 'technical' ? 'Software Engineer' : 
                     type === 'behavioral' ? 'Behavioral Interview' : 'System Designer',
          language: 'JavaScript',
          category: type,
          questions_type: 'mixed',
          time_limit: 30,
          questions_limit: 10,
          is_coding_enabled: type === 'technical',
          start_time: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data && data.id) {
        toast.success('Interview session created');
        navigate(`/interview/${data.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create interview:', error);
      toast.error(error.message || 'Failed to create interview');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">AI Interview Practice</h1>
        
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Improve Your Interview Skills</h2>
              <p className="text-muted-foreground">
                Practice with our AI interviewer that adapts to your responses and provides
                real-time feedback to help you prepare for your next job interview.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Realistic interview questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Detailed feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Multiple interview types</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Choose an Interview Type</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interviewTypes.map((type) => (
            <Card key={type.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="mb-2">{type.icon}</div>
                <CardTitle>{type.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-6 pt-0">
                <p className="text-muted-foreground mb-6">{type.description}</p>
                <Button 
                  onClick={() => startNewInterview(type.id)} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : (
                    <>
                      Start Interview <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Create Custom Interview</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-6">
                Want more control over your interview practice? Create a custom interview
                with specific parameters tailored to your needs.
              </p>
              <Button onClick={() => navigate('/new-interview')}>
                Create Custom Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AIInterviewer;
