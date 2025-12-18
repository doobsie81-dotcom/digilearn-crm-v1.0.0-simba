"use client";

import { useState } from "react";
import { Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TagBadge } from "./tag-badge";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface TagManagerProps {
  leadId?: string;
  dealId?: string;
  currentTags: Tag[];
  onTagsChange?: () => void;
}

export function TagManager({ leadId, dealId, currentTags, onTagsChange }: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const utils = trpc.useUtils();

  const { data: allTags = [] } = trpc.tags.getAll.useQuery();
  const addToLead = trpc.tags.addToLead.useMutation();
  const removeFromLead = trpc.tags.removeFromLead.useMutation();
  const addToDeal = trpc.tags.addToDeal.useMutation();
  const removeFromDeal = trpc.tags.removeFromDeal.useMutation();

  const availableTags = allTags.filter(
    (tag) => !currentTags.some((ct) => ct.id === tag.id)
  );

  const handleAddTag = async () => {
    if (!selectedTagId) return;

    try {
      if (leadId) {
        await addToLead.mutateAsync({ leadId, tagId: selectedTagId });
        utils.tags.getLeadTags.invalidate({ leadId });
        utils.leads.getLead.invalidate(leadId);
      } else if (dealId) {
        await addToDeal.mutateAsync({ dealId, tagId: selectedTagId });
        utils.tags.getDealTags.invalidate({ dealId });
      }

      toast.success("Tag added successfully");
      setSelectedTagId("");
      setIsOpen(false);
      onTagsChange?.();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      if (leadId) {
        await removeFromLead.mutateAsync({ leadId, tagId });
        utils.tags.getLeadTags.invalidate({ leadId });
        utils.leads.getLead.invalidate(leadId);
      } else if (dealId) {
        await removeFromDeal.mutateAsync({ dealId, tagId });
        utils.tags.getDealTags.invalidate({ dealId });
      }

      toast.success("Tag removed successfully");
      onTagsChange?.();
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
              <DialogDescription>
                Select a tag to add to this {leadId ? "lead" : "deal"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTag} disabled={!selectedTagId}>
                  Add Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {currentTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {currentTags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              removable
              onRemove={() => handleRemoveTag(tag.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tags added</p>
      )}
    </div>
  );
}
