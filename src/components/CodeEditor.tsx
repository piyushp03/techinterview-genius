
import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { EditorState } from '@codemirror/state';
import { Card, CardContent } from '@/components/ui/card';

interface CodeEditorProps {
  language: string;
  initialCode: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  initialCode = '',
  onChange,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentCode, setCurrentCode] = useState(initialCode);

  useEffect(() => {
    if (currentLanguage !== language) {
      setCurrentLanguage(language);
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    }
  }, [language, currentLanguage]);

  useEffect(() => {
    if (initialCode !== currentCode) {
      setCurrentCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      // Select the appropriate language extension
      let langExtension;
      switch (language) {
        case 'python':
          langExtension = python();
          break;
        case 'java':
          langExtension = java();
          break;
        case 'cpp':
          langExtension = cpp();
          break;
        case 'javascript':
        default:
          langExtension = javascript();
          break;
      }

      // Create the editor state
      const startState = EditorState.create({
        doc: currentCode,
        extensions: [
          basicSetup,
          langExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newCode = update.state.doc.toString();
              setCurrentCode(newCode);
              onChange(newCode);
            }
          }),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
            ".cm-content, .cm-gutter": { minHeight: "100%" },
            ".cm-gutters": { backgroundColor: "transparent", border: "none" },
            ".cm-activeLineGutter": { backgroundColor: "rgba(0, 0, 0, 0.1)" },
          }),
          EditorView.editable.of(!readOnly),
        ],
      });

      // Create the editor view
      const view = new EditorView({
        state: startState,
        parent: editorRef.current,
      });

      editorViewRef.current = view;

      return () => {
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
      };
    }
  }, [language, currentCode, editorRef.current, readOnly, onChange]);

  return (
    <Card className="w-full h-full border-0 overflow-hidden">
      <CardContent className="p-0 h-full">
        <div ref={editorRef} className="h-full overflow-auto" />
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
