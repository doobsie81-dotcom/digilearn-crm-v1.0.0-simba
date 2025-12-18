import React, { useState, ReactNode } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';
import { Label } from '~/components/ui/label';

interface EditableFieldProps {
  // Value
  value: string | number | null | undefined;
  onSave: (newValue: string) => void | Promise<void>;

  // Field configuration
  type?: 'text' | 'textarea' | 'email' | 'number' | 'tel' | 'select' | 'date';
  placeholder?: string;
  label?: string;
  description?: string;

  // Select options (for type="select")
  options?: Array<{ value: string; label: string }>;

  // Custom display component
  displayComponent?: React.ComponentType<{ value: string | number | null | undefined; children?: ReactNode }>;

  // Display customization
  displayClassName?: string;
  emptyText?: string;

  // Edit mode customization
  inputClassName?: string;
  autoFocus?: boolean;

  // Control
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;

  // Layout
  inline?: boolean;
  showEditButton?: boolean;
  showLabel?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  type = 'text',
  placeholder = 'Enter value...',
  label,
  description,
  options = [],
  displayComponent: DisplayComponent,
  displayClassName,
  emptyText = 'Not set',
  inputClassName,
  autoFocus = true,
  isEditing: controlledIsEditing,
  onEditingChange,
  inline = false,
  showEditButton = true,
  showLabel = true,
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Use controlled or internal state
  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : internalIsEditing;
  const setIsEditing = onEditingChange || setInternalIsEditing;

  const handleEdit = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Render edit mode
  const renderEditMode = () => {
    const commonProps = {
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      placeholder,
      autoFocus,
      disabled: isSaving,
      className: cn(inputClassName),
    };

    let input: ReactNode;

    switch (type) {
      case 'textarea':
        input = <Textarea {...commonProps} rows={3} />;
        break;

      case 'select':
        input = (
          <Select
            value={editValue}
            onValueChange={setEditValue}
            disabled={isSaving}
          >
            <SelectTrigger className={cn(inputClassName)}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;

      default:
        input = <Input {...commonProps} type={type} />;
    }

    return (
      <div className={cn("space-y-2", inline && "flex items-center gap-2")}>
        <div className="flex-1">{input}</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  };

  // Render display mode
  const renderDisplayMode = () => {
    const displayValue = value ?? emptyText;

    const content = (
      <span className={cn(
        "text-sm",
        !value && "text-muted-foreground italic",
        displayClassName
      )}>
        {displayValue}
      </span>
    );

    return (
      <div className={cn("group flex items-center gap-2", inline && "inline-flex")}>
        {DisplayComponent ? (
          <DisplayComponent value={value}>
            {content}
          </DisplayComponent>
        ) : (
          content
        )}
        {showEditButton && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-2">
      {showLabel && label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      {description && !isEditing && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {isEditing ? renderEditMode() : renderDisplayMode()}
    </div>
  );
};

export default EditableField;