
import { useState, useEffect, useRef } from 'react';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';

interface UseCodeMirrorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  initialDoc?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
}

export const useCodeMirror = ({
  containerRef,
  initialDoc = '',
  onChange,
  readOnly = false,
  language = 'javascript',
}: UseCodeMirrorProps) => {
  const [value, setValue] = useState(initialDoc);
  const [isReady, setIsReady] = useState(false);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get language extension based on the language prop
    const getLangExtension = (lang: string) => {
      switch (lang.toLowerCase()) {
        case 'javascript':
        case 'typescript':
        case 'js':
        case 'ts':
          return javascript();
        case 'python':
        case 'py':
          return python();
        case 'java':
          return java();
        case 'cpp':
        case 'c++':
          return cpp();
        case 'rust':
          return rust();
        case 'sql':
          return sql();
        case 'html':
          return html();
        case 'css':
          return css();
        case 'markdown':
        case 'md':
          return markdown();
        default:
          return javascript();
      }
    };

    const langExtension = getLangExtension(language);

    const startState = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        langExtension,
        keymap.of([indentWithTab]),
        EditorView.updateListener.of(update => {
          if (update.changes) {
            const newValue = update.state.doc.toString();
            setValue(newValue);
            onChange?.(newValue);
          }
        }),
        EditorState.readOnly.of(readOnly)
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    return () => {
      view.destroy();
    };
  }, [containerRef, initialDoc, onChange, readOnly, language]);

  return {
    value,
    setValue,
    view: viewRef.current,
    isReady,
  };
};

export default useCodeMirror;
