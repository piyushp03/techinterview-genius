
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/ResumeUploader';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileUp, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { extractTextFromResume, analyzeResume } from '@/utils/openaiService';
import { toast } from 'sonner';

const Resume = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadedFile(files[0]);
    
    try {
      // If it's a PDF, extract text
      if (files[0].type === 'application/pdf') {
        setIsExtracting(true);
        
        // Read the file as base64
        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        
        reader.onload = async () => {
          try {
            const base64data = reader.result?.toString().split(',')[1];
            if (!base64data) {
              throw new Error('Failed to read PDF file');
            }
            
            // Extract text from PDF using OpenAI
            const extractedText = await extractTextFromResume(base64data);
            setResumeText(extractedText);
            setActiveTab('edit');
            toast.success('Successfully extracted text from PDF');
          } catch (error) {
            console.error('Error extracting text from PDF:', error);
            toast.error('Failed to extract text from PDF. Please try again or paste your resume manually.');
          } finally {
            setIsExtracting(false);
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read the PDF file');
          setIsExtracting(false);
        };
      } else if (files[0].type === 'text/plain') {
        // If it's a text file, read it directly
        const reader = new FileReader();
        reader.readAsText(files[0]);
        
        reader.onload = () => {
          setResumeText(reader.result as string);
          setActiveTab('edit');
          toast.success('Successfully loaded text file');
        };
        
        reader.onerror = () => {
          toast.error('Failed to read the text file');
        };
      } else {
        toast.error('Unsupported file type. Please upload a PDF or text file.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please enter or upload your resume first');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis('');
    
    try {
      const analysisResult = await analyzeResume(resumeText);
      setAnalysis(analysisResult);
      setActiveTab('analysis');
      toast.success('Resume analysis complete');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setResumeText('');
    setAnalysis('');
    setUploadedFile(null);
    setActiveTab('upload');
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please sign in to access this feature.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-2">Resume Analysis</h1>
        <p className="text-muted-foreground mb-8">
          Get AI-powered analysis and feedback on your resume to improve your job applications
        </p>
        
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="analysis" disabled={!analysis}>Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Resume</CardTitle>
                  <CardDescription>
                    Upload your resume in PDF or text format for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isUploading || isExtracting ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="text-center text-muted-foreground">
                        {isExtracting ? 'Extracting text from PDF...' : 'Uploading file...'}
                      </p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ) : (
                    <FileUploader
                      onUpload={handleUpload}
                      acceptedFileTypes={{
                        'application/pdf': ['.pdf'],
                        'text/plain': ['.txt']
                      }}
                      maxSize={5 * 1024 * 1024} // 5MB
                    />
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground mb-2 w-full">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Your resume is only used for analysis and is not stored permanently
                  </p>
                  <div className="flex w-full justify-between">
                    <Button variant="outline" onClick={resetAll} disabled={isUploading || isExtracting}>
                      Clear
                    </Button>
                    <Button onClick={() => setActiveTab('edit')} disabled={isUploading || isExtracting}>
                      Continue to Editor
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="edit" className="mt-6">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Edit Your Resume Text</CardTitle>
                  <CardDescription>
                    Review and edit the extracted text before analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste or edit your resume text here..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    Back
                  </Button>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing || !resumeText.trim()}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Analyze Resume
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-6">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Resume Analysis Results</CardTitle>
                  <CardDescription>
                    AI-powered feedback and improvement suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ScrollArea className="h-[500px] rounded-md border p-4">
                    <div className="space-y-4">
                      {analysis.split('\n').map((paragraph, index) => (
                        <p key={index} className={paragraph.startsWith('#') ? 'font-bold text-lg mt-4' : ''}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('edit')}>
                    Edit Resume
                  </Button>
                  <Button onClick={resetAll}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start New Analysis
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="bg-primary/10 rounded-full flex items-center justify-center w-6 h-6 mt-0.5 flex-shrink-0">
                      <span className="text-primary text-sm font-medium">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Your Resume</h4>
                      <p className="text-sm text-muted-foreground">Upload your resume in PDF or text format</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-primary/10 rounded-full flex items-center justify-center w-6 h-6 mt-0.5 flex-shrink-0">
                      <span className="text-primary text-sm font-medium">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Edit and Review</h4>
                      <p className="text-sm text-muted-foreground">Verify the extracted text or make edits if needed</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-primary/10 rounded-full flex items-center justify-center w-6 h-6 mt-0.5 flex-shrink-0">
                      <span className="text-primary text-sm font-medium">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Get AI Analysis</h4>
                      <p className="text-sm text-muted-foreground">Receive detailed feedback and improvement suggestions</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resume Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="text-sm">• Use action verbs to describe your experience</li>
                  <li className="text-sm">• Quantify your achievements with numbers</li>
                  <li className="text-sm">• Tailor your resume to each job application</li>
                  <li className="text-sm">• Keep formatting consistent and clean</li>
                  <li className="text-sm">• Proofread carefully for errors</li>
                  <li className="text-sm">• Highlight relevant skills and experience</li>
                  <li className="text-sm">• Use industry-specific keywords</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resume;
