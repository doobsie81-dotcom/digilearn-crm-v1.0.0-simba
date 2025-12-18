'use client';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import { LucideIcon, Package, Wrench } from 'lucide-react';
import { productTypeEnum } from '~/db/schema';

type ProductType = typeof productTypeEnum[number];

interface ProductTypeBadgeProps {
  type: ProductType;
  className?: string;
}

const typeConfig: Record<ProductType, { label: string; icon: LucideIcon; className: string; dotColor: string; }> = {
  product: {
    label: 'Product',
    icon: Package,
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  service: {
    label: 'Service',
    icon: Wrench,
    className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200',
    dotColor: 'bg-cyan-500',
  },
};

export default function ProductTypeBadge({ type, className }: ProductTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 font-medium',
        config.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}