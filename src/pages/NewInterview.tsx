
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

const roleTypes = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Project Manager",
];

const languages = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Ruby",
  "Swift",
  "Kotlin",
];

const categories = [
  "Algorithms",
  "Data Structures",
  "System Design",
  "Object-Oriented Programming",
  "Frontend Development",
  "Backend Development",
  "Database Design",
  "DevOps & CI/CD",
  "Behavioral",
  "Problem Solving",
  "Language-specific",
];

const FormSchema = z.object({
  roleType: z.string().min(1, "Role type is required"),
  language: z.string().min(1, "Programming language is required"),
  category: z.string().min(1, "Interview category is required"),
  questionsLimit: z.number().int().min(1).max(10),
  timeLimit: z.number().int().min(5).max(60),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  interviewMode: z.enum(["text", "voice", "both"]),
  isCodingEnabled: z.boolean().default(false),
  customPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

const NewInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      roleType: "Software Engineer",
      language: "JavaScript",
      category: "Algorithms",
      questionsLimit: 5,
      timeLimit: 30,
      difficultyLevel: "medium",
      interviewMode: "text",
      isCodingEnabled: true,
      customPrompt: "",
    },
  });

  const createInterview = async (values: FormValues) => {
    setIsCreating(true);

    try {
      const { roleType, language, category, questionsLimit, timeLimit, difficultyLevel, interviewMode, isCodingEnabled, customPrompt } = values;
      
      // For guest users, save session to localStorage and navigate
      if (user?.email === 'guest@example.com') {
        const sessionId = `guest-session-${Date.now()}`;
        
        localStorage.setItem(`interview_session_${sessionId}`, JSON.stringify({
          id: sessionId,
          user_id: user.id,
          role_type: roleType,
          language: language,
          category: category,
          questions_limit: questionsLimit,
          time_limit: timeLimit,
          difficulty_level: difficultyLevel,
          interview_mode: interviewMode,
          is_coding_enabled: isCodingEnabled,
          custom_prompt: customPrompt || null,
          start_time: new Date().toISOString(),
          is_completed: false
        }));
        
        toast.success('Interview session created');
        navigate(`/interview/${sessionId}?role=${roleType}&language=${language}&category=${category}`);
        return;
      }
      
      // For registered users, save to Supabase
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user?.id,
          role_type: roleType,
          language: language,
          category: category,
          questions_limit: questionsLimit,
          time_limit: timeLimit,
          difficulty_level: difficultyLevel,
          interview_mode: interviewMode, 
          is_coding_enabled: isCodingEnabled,
          custom_prompt: customPrompt || null,
          start_time: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      toast.success('Interview session created');
      navigate(`/interview/${data[0].id}`);
    } catch (error: any) {
      console.error('Error creating interview session:', error);
      toast.error(error.message || 'Failed to create interview session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Interview</CardTitle>
          <CardDescription>
            Configure your technical interview session
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createInterview)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="roleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleTypes.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The interview will be tailored for this role.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programming Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map(language => (
                          <SelectItem key={language} value={language}>{language}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary programming language for this interview.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The focus area of the interview questions.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Collapsible
                open={advancedSettingsOpen}
                onOpenChange={setAdvancedSettingsOpen}
                className="border rounded-md p-2"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between">
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Advanced Settings
                    </div>
                    {advancedSettingsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="questionsLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Slider
                              min={1}
                              max={10}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{field.value}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Slider
                              min={5}
                              max={60}
                              step={5}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{field.value}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="easy" id="easy" />
                              </FormControl>
                              <Label htmlFor="easy">Easy</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="medium" id="medium" />
                              </FormControl>
                              <Label htmlFor="medium">Medium</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="hard" id="hard" />
                              </FormControl>
                              <Label htmlFor="hard">Hard</Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCodingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded-md">
                        <div>
                          <FormLabel>Enable Code Editor</FormLabel>
                          <FormDescription>
                            Allow coding during the interview
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom AI Prompt (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a custom prompt for the AI interviewer..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Customize how the AI conducts this interview. Leave empty to use the default prompt.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interviewMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Mode</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="text" id="text" />
                              </FormControl>
                              <Label htmlFor="text">Text</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="voice" id="voice" />
                              </FormControl>
                              <Label htmlFor="voice">Voice</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="both" id="both" />
                              </FormControl>
                              <Label htmlFor="both">Both</Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Choose how you want to interact with the AI interviewer.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Start Interview'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default NewInterview;
