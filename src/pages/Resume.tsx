
// Fix the FileUploader import first
import ResumeUploader from '@/components/ResumeUploader';

// Fix the type issue with analyzeResume by updating how it's called:
const handleAnalyzeResume = async (resumeText: string) => {
  setIsAnalyzing(true);
  try {
    const analysis = await analyzeResume(resumeText);
    setAnalysisResult(analysis.analysisText); // Now using the string from the returned object
    setResumeAnalysis({
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      jobFit: analysis.jobFit,
      score: analysis.score
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    toast.error('Failed to analyze resume');
  } finally {
    setIsAnalyzing(false);
  }
};
