
import { toast } from 'sonner';

// Types for interview analysis
export type AnalysisMetrics = {
  clarity: number;
  conciseness: number;
  depth: number;
  fluency: number;
  confidence: number;
  overall: number;
};

export type InterviewAnalysis = {
  metrics: AnalysisMetrics;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summaryText: string;
};

// Use the OpenAI API key from the openaiService.ts file
const OPENAI_API_KEY = "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";

/**
 * Analyze the full interview session using GPT-4o-mini
 */
export async function analyzeInterviewSession(
  questions: string[],
  answers: string[],
  role: string,
  category: string
): Promise<InterviewAnalysis> {
  try {
    const systemPrompt = `You are an expert interview coach analyzing a technical interview for a ${role} position focusing on ${category}.
    Evaluate the answers based on clarity, conciseness, depth of knowledge, fluency, and confidence.
    Rate each metric on a scale of 1-10 and provide an overall score.
    Identify specific strengths, weaknesses, and provide actionable recommendations.
    
    Format your response as a JSON object with the following structure:
    {
      "metrics": {
        "clarity": number,
        "conciseness": number,
        "depth": number,
        "fluency": number,
        "confidence": number,
        "overall": number
      },
      "strengths": string[],
      "weaknesses": string[],
      "recommendations": string[],
      "summaryText": string
    }`;

    // Prepare interview QA pairs
    let interviewContent = '';
    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      interviewContent += `Question ${i + 1}: ${questions[i]}\nAnswer ${i + 1}: ${answers[i]}\n\n`;
    }

    // Make the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this interview:\n\n${interviewContent}` }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

    return {
      metrics: {
        clarity: analysisResult.metrics.clarity,
        conciseness: analysisResult.metrics.conciseness,
        depth: analysisResult.metrics.depth,
        fluency: analysisResult.metrics.fluency,
        confidence: analysisResult.metrics.confidence,
        overall: analysisResult.metrics.overall
      },
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations,
      summaryText: analysisResult.summaryText
    };
  } catch (error) {
    console.error('Error analyzing interview:', error);
    toast.error('Failed to analyze interview. Please try again.');
    
    // Return default analysis if there's an error
    return {
      metrics: {
        clarity: 5,
        conciseness: 5,
        depth: 5,
        fluency: 5,
        confidence: 5,
        overall: 5
      },
      strengths: ['Good effort in completing the interview'],
      weaknesses: ['Areas for improvement could not be determined'],
      recommendations: ['Practice more interview questions', 'Review basic concepts', 'Try again with a new session'],
      summaryText: 'The interview analysis couldn\'t be completed. We\'ve provided a standard evaluation.'
    };
  }
}

/**
 * Analyze a single answer
 */
export async function analyzeAnswer(
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<{
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach. Evaluate this answer for a ${role} position interview on ${category}.
            Rate it on a scale of 1-10 and provide specific strengths and areas for improvement.
            Format your response as JSON with the following structure:
            {
              "score": number,
              "feedback": string,
              "strengths": string[],
              "weaknesses": string[]
            }`
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nAnswer: ${answer}`
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze answer');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return {
      score: 5,
      feedback: 'We couldn\'t analyze this answer. Please try again.',
      strengths: ['N/A'],
      weaknesses: ['N/A']
    };
  }
}
