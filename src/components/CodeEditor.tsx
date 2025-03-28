
import React, { useEffect, useRef, useState } from 'react';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { sql } from '@codemirror/lang-sql';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import useCodeMirror from '@/hooks/useCodeMirror';

interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
  initialCode?: string;
  onChange?: (code: string) => void;
}

const getLanguageExtension = (language: string) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return javascript();
    case 'typescript':
    case 'ts':
      return javascript({ typescript: true });
    case 'java':
      return java();
    case 'python':
    case 'py':
      return python();
    case 'rust':
    case 'rs':
      return rust();
    case 'c++':
    case 'cpp':
      return cpp();
    case 'html':
      return html();
    case 'sql':
      return sql();
    default:
      return javascript();
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  readOnly = false,
  initialCode = '// Write your code here',
  onChange
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(initialCode);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const languageExtension = getLanguageExtension(language);

    const state = EditorState.create({
      doc: code,
      extensions: [
        keymap.of(defaultKeymap),
        languageExtension,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString();
            setCode(newCode);
            if (onChange) {
              onChange(newCode);
            }
          }
        }),
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly)
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [language, readOnly]);

  useEffect(() => {
    if (editorView && code !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: initialCode
        }
      });
    }
  }, [initialCode]);

  return (
    <div className="w-full h-full border rounded-md overflow-hidden bg-background">
      <div className="bg-muted p-2 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {language.charAt(0).toUpperCase() + language.slice(1)} Editor
          </span>
          {readOnly && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
              Read Only
            </span>
          )}
        </div>
      </div>
      <div className="p-2 h-[calc(100%-40px)] overflow-auto">
        <div
          ref={editorRef}
          className="h-full w-full font-mono text-sm"
        />
      </div>
    </div>
  );
};

export default CodeEditor;
