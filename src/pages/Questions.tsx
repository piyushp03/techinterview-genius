import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const Questions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  
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

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      toast.error(error.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('');
  };

  const handleEdit = (q: any) => {
    setIsAddingNew(false);
    setEditingId(q.id);
    setQuestion(q.question);
    setAnswer(q.answer);
    setCategory(q.category || '');
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('');
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Please fill in both question and answer fields');
      return;
    }
    
    try {
      if (isAddingNew) {
        const { error } = await supabase
          .from('custom_questions')
          .insert({
            user_id: user?.id,
            question,
            answer,
            category: category || null,
          });
          
        if (error) throw error;
        toast.success('Question added successfully');
      } else if (editingId) {
        const { error } = await supabase
          .from('custom_questions')
          .update({
            question,
            answer,
            category: category || null,
          })
          .eq('id', editingId)
          .eq('user_id', user?.id);
          
        if (error) throw error;
        toast.success('Question updated successfully');
      }
      
      handleCancel();
      fetchQuestions();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error(error.message || 'Failed to save question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('custom_questions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      toast.success('Question deleted successfully');
      fetchQuestions();
      
      if (editingId === id) {
        handleCancel();
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error(error.message || 'Failed to delete question');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Custom Questions</h1>
          <Button onClick={handleAddNew} disabled={isAddingNew || !!editingId}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Question
          </Button>
        </div>

        {(isAddingNew || editingId) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{isAddingNew ? 'Add New Question' : 'Edit Question'}</CardTitle>
              <CardDescription>
                Create custom questions that you want to practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer / Notes</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter the answer or your notes here"
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
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
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Question
              </Button>
            </CardFooter>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No custom questions yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first question to start practicing with your own content
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {questions.map((q) => (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div className="pr-8">{q.question}</div>
                    <div className="flex shrink-0 gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(q)}
                        disabled={isAddingNew || !!editingId}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(q.id)}
                        disabled={isAddingNew || !!editingId}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  {q.category && (
                    <CardDescription>
                      Category: {q.category}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">{q.answer}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Questions;
