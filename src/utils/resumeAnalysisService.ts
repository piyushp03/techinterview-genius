
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
    
    // Hardcoded API key for demonstration (in a real app, this would be stored securely)
    const API_KEY = "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";
    
    // Try to use the API key to analyze the resume against the job description
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert resume analyzer. Compare the provided resume against the job description and provide detailed feedback.
              Format your response as a JSON object with the following structure:
              {
                "analysisText": "string",
                "strengths": ["string"],
                "weaknesses": ["string"],
                "suggestions": ["string"],
                "jobFit": "string" (high, medium, or low),
                "score": number (0-100),
                "matchPercentage": number (0-100),
                "keySkills": ["string"],
                "missingSkills": ["string"],
                "keywords": ["string"],
                "summary": "string"
              }`
            },
            {
              role: 'user',
              content: `Compare this resume:\n\n${resumeText}\n\nAgainst this job description:\n\n${jobDescription}`
            }
          ],
          temperature: 0.5,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Error from OpenAI API");
      }
      
      const result = JSON.parse(data.choices[0].message.content);
      return result;
    } catch (apiError) {
      console.error("API error:", apiError);
      // Fall back to the mock implementation if the API call fails
      return fallbackAnalysis(resumeText, jobDescription);
    }
    
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return fallbackAnalysis(resumeText, jobDescription);
  }
};

// Helper function to extract keywords from text (used in fallback)
function extractKeywords(text: string): string[] {
  const commonTechTerms = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'SQL',
    'Python', 'Java', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'Agile',
    'Frontend', 'Backend', 'Full Stack', 'DevOps', 'CI/CD', 'Testing', 'Redux',
    'REST API', 'GraphQL', 'HTML', 'CSS', 'Sass', 'UI/UX', 'Authentication',
    'Security', 'Performance', 'Optimization', 'Debugging', 'Cloud', 'Microservices',
    'Vue.js', 'Angular', 'Next.js', 'Gatsby', 'Webpack', 'Babel', 'ESLint'
  ];
  
  return commonTechTerms
    .filter(term => text.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 12);
}

// Fallback analysis function when API call fails
function fallbackAnalysis(resumeText: string, jobDescription: string): ResumeAnalysisResult {
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
}
