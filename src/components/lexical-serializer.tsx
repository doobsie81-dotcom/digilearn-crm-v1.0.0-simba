'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
//import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export function ReadOnlyLexicalRenderer({ content }: { content: string }) {
  const initialConfig = {
    namespace: 'ReadOnlyEditor',
    editable: false,
    editorState: content,
    onError: (error: Error) => console.error(error),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}