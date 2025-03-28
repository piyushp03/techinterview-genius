
import { toast } from 'sonner';

// Use the OpenAI API key from the openaiService.ts file
const OPENAI_API_KEY = "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";

/**
 * Extract text from PDF using OCR
 */
export async function extractTextFromPDF(pdfBase64: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting text from PDF documents. Extract all text from this PDF.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all the text from this PDF document. Preserve formatting when possible.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract text from PDF');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    toast.error('Failed to extract text from PDF');
    return '';
  }
}

/**
 * Extract interview Q&A from PDF
 */
export async function extractInterviewQA(pdfBase64: string): Promise<{
  questions: string[];
  answers: string[];
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting interview questions and answers from documents. Extract all Q&A pairs from this document.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all interview questions and answers from this document. Format your response as JSON with "questions" and "answers" arrays.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract Q&A from PDF');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      questions: result.questions || [],
      answers: result.answers || []
    };
  } catch (error) {
    console.error('Error extracting Q&A from PDF:', error);
    toast.error('Failed to extract Q&A from PDF');
    return {
      questions: [],
      answers: []
    };
  }
}
