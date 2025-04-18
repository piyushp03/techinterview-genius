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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Code, Globe, Briefcase, Save, Timer, List, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  roleType: z.string().min(1, { message: "Role is required" }),
  language: z.string().min(1, { message: "Language is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  questionsType: z.string().min(1, { message: "Questions type is required" }),
  timeLimit: z.number().min(5).max(120),
  questionsLimit: z.number().min(5).max(100),
  isCodingEnabled: z.boolean(),
});

const NewInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [questionsType, setQuestionsType] = useState('mixed');
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionsLimit, setQuestionsLimit] = useState(30);
  const [isCodingEnabled, setIsCodingEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      roleType: '',
      language: '',
      category: '',
      questionsType: 'mixed',
      timeLimit: 30,
      questionsLimit: 30,
      isCodingEnabled: false,
    },
  });

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

  const questionTypes = [
    { value: 'objective', label: 'Objective (Multiple choice)' },
    { value: 'subjective', label: 'Subjective (Open-ended)' },
    { value: 'mixed', label: 'Mixed (Both types)' },
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
          questions_type: questionsType,
          time_limit: timeLimit,
          questions_limit: questionsLimit,
          is_coding_enabled: isCodingEnabled,
          start_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Interview session created');
    
    // Navigate to the interview session
    if (data && data.id) {
      navigate(`/interview/${data.id}`);
    } else {
      throw new Error('Failed to get interview session ID');
    }
  } catch (error: any) {
    console.error('Failed to create interview session:', error);
    toast.error(error.message || 'Failed to create interview session');
  } finally {
    setIsLoading(false);
  }
};

  const handleSaveTemplate = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('custom_interview_templates')
        .insert({
          user_id: user?.id,
          title: values.title,
          description: values.description || '',
          role_type: values.roleType,
          language: values.language,
          category: values.category,
          questions_type: values.questionsType,
          time_limit: values.timeLimit,
          questions_limit: values.questionsLimit,
          is_coding_enabled: values.isCodingEnabled,
        });

      if (error) throw error;

      toast.success('Interview template saved');
      setSaveDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const openSaveDialog = () => {
    form.setValue('roleType', roleType);
    form.setValue('language', language);
    form.setValue('category', category);
    form.setValue('questionsType', questionsType);
    form.setValue('timeLimit', timeLimit);
    form.setValue('questionsLimit', questionsLimit);
    form.setValue('isCodingEnabled', isCodingEnabled);
    setSaveDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Create New Interview</h1>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={openSaveDialog}
                disabled={!roleType || !language || !category}
              >
                <Save className="h-4 w-4" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Save Interview Template</DialogTitle>
                <DialogDescription>
                  Save this interview configuration as a template for future use
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveTemplate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Frontend JavaScript Interview" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of this template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CheckSquare className="h-8 w-8 text-blue-500" />
                    <CardTitle>Question Type</CardTitle>
                  </div>
                  <CardDescription>Choose the style of questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="questionsType">Questions Style</Label>
                      <Select value={questionsType} onValueChange={setQuestionsType}>
                        <SelectTrigger id="questionsType">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                    <Timer className="h-8 w-8 text-amber-500" />
                    <CardTitle>Time Limit</CardTitle>
                  </div>
                  <CardDescription>Set maximum interview duration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="timeSlider">Duration: {timeLimit} minutes</Label>
                      <Slider
                        id="timeSlider"
                        min={5}
                        max={120}
                        step={5}
                        value={[timeLimit]}
                        onValueChange={(value) => setTimeLimit(value[0])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <List className="h-8 w-8 text-purple-500" />
                    <CardTitle>Questions Limit</CardTitle>
                  </div>
                  <CardDescription>Maximum number of questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="questionSlider">Questions: {questionsLimit}</Label>
                      <Slider
                        id="questionSlider"
                        min={5}
                        max={100}
                        step={5}
                        value={[questionsLimit]}
                        onValueChange={(value) => setQuestionsLimit(value[0])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Code className="h-8 w-8 text-red-500" />
                  <CardTitle>Coding Mode</CardTitle>
                </div>
                <CardDescription>Enable code editor for solving coding challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Switch
                    id="coding-mode"
                    checked={isCodingEnabled}
                    onCheckedChange={setIsCodingEnabled}
                  />
                  <Label htmlFor="coding-mode">
                    {isCodingEnabled ? 'Coding challenges enabled' : 'Coding challenges disabled'}
                  </Label>
                </div>
                {isCodingEnabled && (
                  <p className="text-sm text-muted-foreground mt-4">
                    The interview will include coding challenges with a built-in editor and sandbox for testing solutions.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
