import { useEffect, useRef } from 'react';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { basicSetup } from 'codemirror';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import type { CollaborationSession } from '../lib/collaboration';
export default function MarkdownEditor({ session }: { session: CollaborationSession }) {
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!node.current) return;
    const undo = new Y.UndoManager(session.content);
    const state = EditorState.create({ doc: session.content.toString(), extensions: [
      basicSetup,
      markdown(),
      keymap.of(defaultKeymap),
      placeholder('Start with a thought, a heading, or a shared idea...'),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Collaborative Markdown editor' }),
      EditorView.theme({
        '&': { backgroundColor: 'transparent', color: '#e8e9f5', height: '100%' },
        '.cm-content': { minHeight: '480px', padding: '28px 4px 80px', fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.85', caretColor: '#b09aff' },
        '.cm-gutters': { display: 'none' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit' },
        '.cm-activeLine': { backgroundColor: 'rgba(147, 123, 248, 0.06)' },
        '.cm-selectionBackground': { backgroundColor: '#735bd755 !important' },
        '&.cm-focused': { outline: 'none' }
      }),
      yCollab(session.content, session.awareness, { undoManager: undo })
    ] });
    const view = new EditorView({ state, parent: node.current });
    return () => { view.destroy(); undo.destroy(); };
  }, [session]);
  return <div className="markdown-editor" aria-label="Collaborative Markdown editor" ref={node} data-testid="editor" />;
}
