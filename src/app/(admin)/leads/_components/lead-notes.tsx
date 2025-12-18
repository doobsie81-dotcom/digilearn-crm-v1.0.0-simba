"use client";

import { CreateNoteForm } from "~/components/forms/create-note-form";
import { ReadOnlyLexicalRenderer } from "~/components/lexical-serializer";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { trpc } from "~/trpc/client";
import { format } from "date-fns";
import { FileText, User } from "lucide-react";
import { useMemo } from "react";

interface LeadNotesProps {
  leadId: string;
  isReadOnly?: boolean;
}

export const LeadNotes = ({ leadId, isReadOnly = false }: LeadNotesProps) => {
  const { data: notes, isLoading } = trpc.notes.getLeadNotes.useQuery({
    leadId: leadId,
  });

  // Sort notes in descending order by creation date (newest first)
  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order
    });
  }, [notes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Note Form */}
      {!isReadOnly && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <CreateNoteForm leadId={leadId} />
          </CardContent>
        </Card>
      )}

      {/* Notes Timeline */}
      {!sortedNotes || sortedNotes.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No notes yet</p>
            <p className="text-sm text-muted-foreground">Add your first note to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <Separator
            orientation="vertical"
            className="absolute left-2 top-4 h-[calc(100%-2rem)] bg-border"
          />
          <div className="space-y-8">
            {sortedNotes.map((note, index) => (
              <div key={note.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 flex items-center justify-center">
                  <Avatar className="h-9 w-9 border-2 border-background">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {note.activity?.createdByUser?.name
                        ? note.activity.createdByUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Note Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    {/* Note Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {note.activity?.createdByUser?.name || "Unknown User"}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <time className="text-xs text-muted-foreground">
                            {note.createdAt
                              ? format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : "Unknown date"}
                          </time>
                        </div>
                      </div>
                      {note.activity?.subject && (
                        <p className="text-xs text-muted-foreground">
                          {note.activity.subject}
                        </p>
                      )}
                    </div>

                    {/* Note Content */}
                    <CardContent className="px-0 py-0">
                      <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                        <ReadOnlyLexicalRenderer content={note.content} />
                      </div>
                    </CardContent>

                    {/* Note Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                        {note.tags.split(",").map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
