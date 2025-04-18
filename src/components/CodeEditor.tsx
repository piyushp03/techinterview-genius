
import React, { useRef, useEffect, useState } from 'react';
import { useCodeMirror } from '@/hooks/useCodeMirror';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
  initialCode?: string;
  onChange?: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  readOnly = false,
  initialCode = '',
  onChange
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(!readOnly);
  
  const { view: editorView } = useCodeMirror({
    containerRef: editorRef,
    initialDoc: initialCode,
    onChange: (value) => {
      setCode(value);
      onChange?.(value);
    },
    readOnly: readOnly,
    language
  });

  useEffect(() => {
    if (initialCode !== code && !isEditing) {
      setCode(initialCode);
    }
  }, [initialCode]);
  
  return (
    <div className="border rounded-md overflow-hidden">
      {isEditing ? (
        <div
          ref={editorRef}
          className="min-h-[200px] font-mono text-sm"
          style={{ height: '100%' }}
        />
      ) : (
        <SyntaxHighlighter
          language={language}
          style={vs2015}
          customStyle={{
            margin: 0,
            padding: '1rem',
            borderRadius: '0.375rem',
            minHeight: '200px',
            overflowX: 'auto'
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default CodeEditor;
