import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Select({ className, children, ...props }) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-input bg-background/55 px-3 pr-10 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 focus:border-ring focus:ring-2 focus:ring-ring/35",
          "shadow-inner shadow-black/15 [&_option]:bg-card [&_option]:text-foreground [&_option]:font-semibold [&_option]:py-2",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
    </span>
  );
}
