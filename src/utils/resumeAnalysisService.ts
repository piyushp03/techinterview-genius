
import { ResumeAnalysisResult } from './openaiService';

/**
 * Analyzes a resume against a job description and provides feedback
 */
export const analyzeResume = async (
  resumeText: string, 
  jobDescription: string
): Promise<ResumeAnalysisResult> => {
  try {
    console.log("Analyzing resume against job description");
    console.log("Resume length:", resumeText.length);
    console.log("Job description length:", jobDescription.length);
    
    // For now, we'll use the OpenAI service's mock implementation
    // In a real implementation, we would send both the resume and job description
    // to an API for analysis
    
    // Simulate matching percentage based on some keywords from job description
    const keywords = extractKeywords(jobDescription);
    const matchCount = keywords.filter(keyword => 
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    const matchPercentage = Math.min(Math.round((matchCount / keywords.length) * 100), 95);
    
    // Determine job fit based on match percentage
    let jobFit: string;
    if (matchPercentage >= 75) {
      jobFit = 'high';
    } else if (matchPercentage >= 50) {
      jobFit = 'medium';
    } else {
      jobFit = 'low';
    }
    
    // Mock key skills (skills found in both resume and job description)
    const keySkills = extractKeywords(resumeText)
      .filter(skill => jobDescription.toLowerCase().includes(skill.toLowerCase()))
      .slice(0, 6);
    
    // Mock missing skills (skills in job description but not in resume)
    const missingSkills = extractKeywords(jobDescription)
      .filter(skill => !resumeText.toLowerCase().includes(skill.toLowerCase()))
      .slice(0, 6);
    
    return {
      analysisText: "Your resume has been analyzed against the job description. Consider highlighting your relevant experience more clearly.",
      strengths: [
        "Good technical skills alignment",
        "Experience matches job requirements",
        "Clear presentation of qualifications"
      ],
      weaknesses: [
        "Could improve quantifiable achievements",
        "Some key skills from job description are missing",
        "Experience description could be more detailed"
      ],
      suggestions: [
        "Add more measurable achievements",
        "Include specific examples of your skills in action",
        "Tailor your resume more specifically to this role"
      ],
      jobFit,
      score: matchPercentage,
      matchPercentage,
      keySkills,
      missingSkills,
      keywords: extractKeywords(jobDescription),
      summary: "Your resume shows good alignment with the job requirements but could benefit from more specific examples and quantifiable achievements. Consider adding more details about your experience with key technologies mentioned in the job description."
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error('Failed to analyze resume');
  }
};

// Helper function to extract "keywords" from text
function extractKeywords(text: string): string[] {
  // In a real implementation, this would use NLP to extract actual keywords
  // For this demo, we'll just use some common tech terms
  const commonTechTerms = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'SQL',
    'Python', 'Java', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'Agile',
    'Frontend', 'Backend', 'Full Stack', 'DevOps', 'CI/CD', 'Testing', 'Redux',
    'REST API', 'GraphQL', 'HTML', 'CSS', 'Sass', 'UI/UX', 'Authentication',
    'Security', 'Performance', 'Optimization', 'Debugging', 'Cloud', 'Microservices',
    'Vue.js', 'Angular', 'Next.js', 'Gatsby', 'Webpack', 'Babel', 'ESLint'
  ];
  
  // Return terms that appear in the text
  // In reality, this would be much more sophisticated
  return commonTechTerms
    .filter(term => text.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 12); // Limit to 12 keywords
}
