import type * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "rounded-[4px] border border-border-strong bg-sunken px-[5px] text-[11px] leading-4 font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
