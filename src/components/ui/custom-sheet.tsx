import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./sheet";

interface CustomSheetProps {
  title: React.ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function CustomSheet({
  children,
  title,
  description,
  isOpen,
  onClose,
  className,
  side = 'right',
}: CustomSheetProps) {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onChange}>
      <SheetContent side={side} className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CustomSheet;