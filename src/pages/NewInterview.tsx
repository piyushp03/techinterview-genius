import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Globe, Briefcase } from 'lucide-react';

const NewInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const techRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'Mobile Developer',
    'QA Engineer',
    'Product Manager',
  ];

  const languages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'Go',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
  ];

  const categories = [
    'General Programming',
    'Algorithms & Data Structures',
    'System Design',
    'Object-Oriented Design',
    'Database',
    'Web Development',
    'Cloud & DevOps',
    'Behavioral',
  ];

  const handleStartInterview = async () => {
    if (!roleType || !language || !category) {
      toast.error('Please select all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user?.id,
          role_type: roleType,
          language: language,
          category: category,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Interview session created');
      navigate(`/interview/${data.id}`);
    } catch (error: any) {
      console.error('Failed to create interview session:', error);
      toast.error(error.message || 'Failed to create interview session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">Create New Interview</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle>Select Role</CardTitle>
              </div>
              <CardDescription>Choose the role you want to practice for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role Type</Label>
                  <Select value={roleType} onValueChange={setRoleType}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {techRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-indigo-500" />
                <CardTitle>Programming Language</CardTitle>
              </div>
              <CardDescription>Select your preferred programming language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-green-500" />
                <CardTitle>Interview Category</CardTitle>
              </div>
              <CardDescription>Choose what type of interview to practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleStartInterview} 
            disabled={isLoading || !roleType || !language || !category}
            className="px-8 py-6 text-lg"
          >
            {isLoading ? 'Creating Interview...' : 'Start Interview'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewInterview;
