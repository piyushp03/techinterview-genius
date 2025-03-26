
import React, { useState, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { basicSetup } from 'codemirror';

export interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
  initialCode?: string;
  onChange?: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language = 'javascript', 
  readOnly = false, 
  initialCode = '// Start coding here',
  onChange 
}) => {
  const [editorElement, setEditorElement] = useState<HTMLElement | null>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorElement) return;

    const languageExtension = getLanguageExtension(language);

    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        languageExtension,
        EditorView.updateListener.of(update => {
          if (update.changes && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" }
        }),
        EditorState.readOnly.of(readOnly)
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorElement
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [editorElement, language, readOnly, initialCode, onChange]);

  const getLanguageExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return javascript();
      case 'typescript':
      case 'ts':
        return javascript({ typescript: true });
      case 'jsx':
        return javascript({ jsx: true });
      case 'tsx':
        return javascript({ jsx: true, typescript: true });
      case 'python':
      case 'py':
        return python();
      case 'java':
        return java();
      case 'cpp':
      case 'c++':
        return cpp();
      case 'css':
        return css();
      case 'html':
        return html();
      case 'json':
        return json();
      case 'markdown':
      case 'md':
        return markdown();
      case 'rust':
        return rust();
      case 'sql':
        return sql();
      case 'xml':
        return xml();
      default:
        return javascript();
    }
  };

  return (
    <div className="h-full w-full border rounded-md overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-sm font-medium">
          {language.toUpperCase()} Editor {readOnly ? '(Read Only)' : ''}
        </span>
      </div>
      <div 
        ref={setEditorElement} 
        className="h-[calc(100%-40px)] w-full overflow-auto"
      />
    </div>
  );
};

export default CodeEditor;
