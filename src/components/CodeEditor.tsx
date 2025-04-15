
import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
  language?: string;
  initialCode?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language = 'javascript',
  initialCode = '// Write your code here',
  onChange,
  readOnly = false
}) => {
  const [code, setCode] = useState(initialCode);
  const [editorHeight, setEditorHeight] = useState('300px');

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    // Adjust height based on content
    const lineCount = (code.match(/\n/g) || []).length + 1;
    const calculatedHeight = Math.max(300, lineCount * 20);
    setEditorHeight(`${calculatedHeight}px`);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange?.(newCode);
  };

  return (
    <div className="relative rounded-md border">
      <div className="flex items-center justify-between px-3 py-1 border-b bg-muted">
        <span className="text-sm font-medium">
          {language.charAt(0).toUpperCase() + language.slice(1)}
        </span>
      </div>

      <div className="relative" style={{ height: editorHeight }}>
        {readOnly ? (
          <div className="w-full h-full p-4 overflow-auto">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              showLineNumbers
              wrapLongLines
            >
              {code}
            </SyntaxHighlighter>
          </div>
        ) : (
          <>
            <textarea
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none bg-transparent z-10"
              value={code}
              onChange={handleCodeChange}
              style={{ color: 'transparent', caretColor: 'white' }}
              readOnly={readOnly}
            />
            <div className="absolute inset-0 w-full h-full overflow-auto pointer-events-none">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers
                wrapLongLines
                codeTagProps={{
                  style: {
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                  }
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
