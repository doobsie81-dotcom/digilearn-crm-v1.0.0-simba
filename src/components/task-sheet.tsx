"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { CalendarIcon, Clock, User, CheckCircle2, MessageSquare, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { AssigneeSelector } from "./assignee-selector";

interface TaskSheetProps {
  taskId: string;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", color: "text-muted-foreground" },
  { value: "in-progress", label: "In Progress", color: "text-blue-600" },
  { value: "done", label: "Done", color: "text-emerald-600" },
  { value: "backlog", label: "Backlog", color: "text-amber-600" },
] as const;

export function TaskSheet({ taskId }: TaskSheetProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  const utils = trpc.useUtils();

  // Fetch task data
  const { data: task, isLoading: isLoadingTask } = trpc.tasks.getTaskById.useQuery(
    { id: taskId },
    { enabled: !!taskId }
  );

  // Fetch comments
  const { data: comments = [], isLoading: isLoadingComments } = trpc.tasks.getComments.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  // Update task mutation
  const updateTask = trpc.tasks.updateTask.useMutation({
    onSuccess: () => {
      utils.tasks.getTaskById.invalidate({ id: taskId });
      utils.tasks.getTasks.invalidate();
      toast.success("Task updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  // Add comment mutation
  const addComment = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      utils.tasks.getComments.invalidate({ taskId });
      setNewComment("");
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  // Delete comment mutation
  const deleteComment = trpc.tasks.deleteComment.useMutation({
    onSuccess: () => {
      utils.tasks.getComments.invalidate({ taskId });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  const handleTitleSave = () => {
    if (tempTitle && tempTitle !== task?.title) {
      updateTask.mutate({
        id: taskId,
        title: tempTitle,
      });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTempTitle(task?.title || "");
      setIsEditingTitle(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    addComment.mutate({
      taskId,
      comment: newComment,
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate({ id: commentId });
    }
  };

  const handleStatusChange = (status: string) => {
    updateTask.mutate({
      id: taskId,
      status: status as "todo" | "in-progress" | "done" | "backlog",
    });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateTask.mutate({
      id: taskId,
      assignedTo: assigneeId || undefined,
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    if (date) {
      updateTask.mutate({
        id: taskId,
        dueDate: date,
      });
    }
  };

  if (isLoadingTask) {
    return (
      <Card className="overflow-hidden border-border/40">
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card className="overflow-hidden border-border/40">
        <div className="p-8">
          <p className="text-muted-foreground">Task not found</p>
        </div>
      </Card>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === task.status);
  const entityType = task.leadId ? "Lead" : task.dealId ? "Deal" : null;
  const entityId = task.leadId || task.dealId || "";

  return (
    <Card className="overflow-hidden border-border/40">
      <div className="p-8">
        {/* Title Section */}
        <div className="mb-8">
          {isEditingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-3xl font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          ) : (
            <h2
              className="text-3xl font-semibold tracking-tight cursor-text hover:bg-muted/50 rounded px-3 py-2 -mx-3 transition-colors"
              onClick={() => {
                setIsEditingTitle(true);
                setTempTitle(task.title);
              }}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Properties Section */}
        <div className="space-y-4 mb-8">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Status</span>
            </div>
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48 h-8 border-0 bg-muted/50 hover:bg-muted focus:ring-1">
                <SelectValue>
                  <span className={currentStatus?.color}>{currentStatus?.label}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={status.color}>{status.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          {entityType && entityId && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Assignee</span>
              </div>
              <div className="w-48">
                <AssigneeSelector
                  currentAssignee={task.activity?.assignedToUser || null}
                  onAssigneeChange={handleAssigneeChange}
                  isPending={updateTask.isPending}
                  entityType={entityType}
                  entityId={entityId}
                  layout="inline"
                  showLabel={false}
                />
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Due Date</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-48 h-8 justify-start border-0 bg-muted/50 hover:bg-muted px-3">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {task.dueDate ? (
                    format(new Date(task.dueDate), "MMM dd, yyyy")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={handleDueDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-8" />

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            <span>Comments</span>
            <span className="text-muted-foreground">({comments.length})</span>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none focus-visible:ring-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Press ⌘+Enter to post</span>
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
              >
                {addComment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Comment"
                )}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {comments.map((comment) => {
                const authorName = comment.commentedByUser?.name || comment.commentedByUser?.email || "Unknown";
                const initials = authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={comment.id}
                    className="group relative bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM dd, h:mm a")}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteComment.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
