"use client";

import { CreateNoteForm } from "~/components/forms/create-note-form";
import { ReadOnlyLexicalRenderer } from "~/components/lexical-serializer";
import { User } from "~/db/types";
import { trpc } from "~/trpc/client";

interface DealNotesProps {
  dealId: string;
  leadId: string;
  users?: User[];
}

//type Tag = { id: string; text: string };

export const DealNotes = ({ dealId, leadId }: DealNotesProps) => {
  const { data: notes, isLoading } = trpc.notes.getDealNotes.useQuery({
    dealId: dealId,
  });

  if (isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <CreateNoteForm leadId={leadId} dealId={dealId} />
      {!notes || notes?.length === 0 ? (
        <div className="h-16 grid place-items-center">
          <p>No notes found</p>
        </div>
      ) : (
        notes.map((note) => (
          <div className="bg-accent/50 p-4" key={note.id}>
            <div></div>
            <div>
              <ReadOnlyLexicalRenderer content={note.content} />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
