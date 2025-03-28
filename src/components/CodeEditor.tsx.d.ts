
import React from 'react';

export interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
  initialCode?: string;
  onChange?: (code: string) => void;
}

declare const CodeEditor: React.FC<CodeEditorProps>;

export default CodeEditor;
