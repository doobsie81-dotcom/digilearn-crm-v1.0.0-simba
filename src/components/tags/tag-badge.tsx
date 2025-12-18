import { X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  removable?: boolean;
}

export function TagBadge({ name, color, onRemove, removable = false }: TagBadgeProps) {
  return (
    <Badge
      style={{ backgroundColor: color, borderColor: color }}
      className="text-white gap-1 pr-1"
    >
      <span>{name}</span>
      {removable && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
