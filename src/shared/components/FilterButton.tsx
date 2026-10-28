"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import { Button, ButtonProps } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterButtonProps extends ButtonProps {
  activeCount?: number;
  isOpen?: boolean;
  label?: string;
}

export const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ activeCount = 0, isOpen = false, label = "Bộ lọc", className, variant, ...props }, ref) => {
    const isActive = activeCount > 0 || isOpen;
    const computedVariant = variant || (isActive ? "default" : "outline");

    return (
      <Button
        ref={ref}
        variant={computedVariant}
        size="sm"
        className={cn(
          "h-8.5 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0",
          !variant && isActive && "shadow-sm shadow-primary/20",
          className
        )}
        {...props}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>{label}</span>
        {activeCount > 0 && (
          <Badge
            variant={isActive && computedVariant === "default" ? "secondary" : "default"}
            className="h-4.5 min-w-4.5 px-1 text-[10px] ml-0.5 font-bold flex items-center justify-center rounded-full"
          >
            {activeCount}
          </Badge>
        )}
      </Button>
    );
  }
);

FilterButton.displayName = "FilterButton";
