'use client'

import { Mail, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Email } from "~/db/types";
import { format } from "date-fns";

interface EmailItemProps {
    email: Email;
    onDelete: (id: string) => void;
}

export const EmailItem = ({ email, onDelete }: EmailItemProps) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <h3 className="font-semibold truncate">{email.subject}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">To:</span> {email.recipients}
        </p>
        <p className="text-sm text-gray-700 line-clamp-2">{email.body}</p>
        <p className="text-xs text-gray-400 mt-2">
          {format(email.createdAt, 'Ppp')}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(email.id)}
        className="flex-shrink-0"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  </Card>
);
