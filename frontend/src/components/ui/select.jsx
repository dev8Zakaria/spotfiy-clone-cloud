import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
