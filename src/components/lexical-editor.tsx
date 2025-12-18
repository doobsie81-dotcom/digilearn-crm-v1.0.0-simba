import { EditorState, ParagraphNode, TextNode } from "lexical";
import { useRef } from "react";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import ToolbarPlugin from "./lexical-toolbar-plugin";

const theme = {};

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

export function LexEditor({
  onChange,
  placeholder,
}: {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const editorStateRef = useRef<EditorState | undefined>(undefined);
  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
    nodes: [ParagraphNode, TextNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="w-full bg-muted rounded-md">
        <ToolbarPlugin />
        <div className="border-t border-input p-2.5 relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[75px] resize-none outline-0"
                aria-placeholder={placeholder ?? "Enter some text..."}
                placeholder={
                  <div className="text-muted-foreground absolute top-3 text-[15px] select-none inline-block pointer-events-none">
                    {placeholder ?? "Enter some text..."}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin
            onChange={(editorState: EditorState) => {
              editorStateRef.current = editorState;
              onChange(JSON.stringify(editorState));
            }}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
