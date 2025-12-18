"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
  hasBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = undefined,
  hasBackButton = false,
}) => {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-x-4">
        {hasBackButton && (
          <Button size="sm" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="ml-auto">{actions}</div>
    </div>
  );
};

export default PageHeader;
