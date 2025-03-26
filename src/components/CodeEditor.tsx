import { useState, useEffect } from 'react';
import { Check, Copy, Code, Terminal } from 'lucide-react';
import { useInterview, ProgrammingLanguage } from '@/context/InterviewContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
}

const codeTemplates: Record<string, string> = {
  javascript: `// JavaScript solution
function solution(input) {
  // Your code here
  return result;
}

// Example usage
const result = solution([1, 2, 3]);
console.log(result);
`,
  typescript: `// TypeScript solution
function solution(input: number[]): number {
  // Your code here
  return 0;
}

// Example usage
const result = solution([1, 2, 3]);
console.log(result);
`,
  python: `# Python solution
def solution(input):
    # Your code here
    return result

# Example usage
result = solution([1, 2, 3])
print(result)
`,
  java: `// Java solution
public class Solution {
    public static void main(String[] args) {
        int[] input = {1, 2, 3};
        int result = solution(input);
        System.out.println(result);
    }

    public static int solution(int[] input) {
        // Your code here
        return 0;
    }
}
`,
  csharp: `// C# solution
using System;

class Program {
    static void Main() {
        int[] input = {1, 2, 3};
        int result = Solution(input);
        Console.WriteLine(result);
    }

    static int Solution(int[] input) {
        // Your code here
        return 0;
    }
}
`,
  cpp: `// C++ solution
#include <iostream>
#include <vector>

int solution(const std::vector<int>& input) {
    // Your code here
    return 0;
}

int main() {
    std::vector<int> input = {1, 2, 3};
    int result = solution(input);
    std::cout << result << std::endl;
    return 0;
}
`,
  go: `// Go solution
package main

import "fmt"

func solution(input []int) int {
    // Your code here
    return 0
}

func main() {
    input := []int{1, 2, 3}
    result := solution(input)
    fmt.Println(result)
}
`,
  ruby: `# Ruby solution
def solution(input)
  # Your code here
  return 0
end

# Example usage
result = solution([1, 2, 3])
puts result
`,
};

const languages = [
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
  { id: 'typescript', name: 'TypeScript', extension: 'ts' },
  { id: 'python', name: 'Python', extension: 'py' },
  { id: 'java', name: 'Java', extension: 'java' },
  { id: 'csharp', name: 'C#', extension: 'cs' },
  { id: 'cpp', name: 'C++', extension: 'cpp' },
  { id: 'go', name: 'Go', extension: 'go' },
  { id: 'ruby', name: 'Ruby', extension: 'rb' },
];

const CodeEditor = ({ language: propLanguage, readOnly = false }: CodeEditorProps) => {
  const { selectedLanguage, setLanguage } = useInterview();
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const effectiveLanguage = propLanguage || selectedLanguage;

  useEffect(() => {
    setCode(codeTemplates[effectiveLanguage] || '// Write your code here');
  }, [effectiveLanguage]);

  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setLanguage(language);
  };

  const handleRunCode = () => {
    if (readOnly) return;
    
    setIsRunning(true);
    setOutput('');
    
    setTimeout(() => {
      const outputs = {
        javascript: '6',
        typescript: '6',
        python: '6',
        java: '6',
        csharp: '6',
        cpp: '6',
        go: '6',
        ruby: '6',
      };
      
      const mockOutput = `Running ${languages.find(l => l.id === effectiveLanguage)?.name || effectiveLanguage}...\n\n${outputs[effectiveLanguage] || 'Error: Could not run code'}`;
      setOutput(mockOutput);
      setIsRunning(false);
    }, 1500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
        toast.error('Failed to copy code');
      });
  };

  const selectedLanguageInfo = languages.find(lang => lang.id === effectiveLanguage);

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b">
        <div className="flex items-center space-x-1">
          <Code className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">Code Editor</h3>
          <span className="text-xs px-2 py-0.5 ml-2 bg-muted rounded-full">
            {selectedLanguageInfo?.name || 'JavaScript'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {!readOnly && (
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-xs">
                {selectedLanguageInfo?.name || 'Language'} <span className="ml-1 opacity-60">▼</span>
              </Button>
              
              <div className="absolute right-0 mt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-10">
                <div className="py-1 bg-popover border rounded-md shadow-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id as ProgrammingLanguage)}
                      className={`block w-full text-left px-4 py-1.5 text-xs ${
                        effectiveLanguage === lang.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          <textarea
            value={code}
            onChange={(e) => !readOnly && setCode(e.target.value)}
            className="w-full h-full p-4 bg-black text-green-400 font-mono text-sm focus:outline-none resize-none"
            spellCheck="false"
            readOnly={readOnly}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyCode}
            className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="border-t bg-black p-4 text-white font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-4 w-4" />
              <span className="text-xs">Console</span>
            </div>
            <Button
              size="sm"
              onClick={handleRunCode}
              disabled={isRunning || readOnly}
              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 text-xs h-7 rounded"
            >
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
          </div>
          
          <div className="bg-gray-900 p-3 rounded text-white/80 min-h-[100px] max-h-[150px] overflow-y-auto">
            {output ? (
              <pre className="whitespace-pre-wrap text-xs">{output}</pre>
            ) : (
              <div className="text-white/40 text-xs">Run your code to see output</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
