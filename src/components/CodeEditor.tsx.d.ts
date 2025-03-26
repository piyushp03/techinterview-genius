
import React from 'react';

declare module '@/components/CodeEditor' {
  export interface CodeEditorProps {
    language?: string;
    readOnly?: boolean;
    initialCode?: string;
    onChange?: (code: string) => void;
  }
  
  const CodeEditor: React.FC<CodeEditorProps>;
  
  export default CodeEditor;
}
