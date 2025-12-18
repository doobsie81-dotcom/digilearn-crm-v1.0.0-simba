"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateLeadModalForm } from "~/components/modals/add-lead-form";
import { Button } from "~/components/ui/button";

export function CreateLeadForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add lead
      </Button>
      <CreateLeadModalForm open={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
