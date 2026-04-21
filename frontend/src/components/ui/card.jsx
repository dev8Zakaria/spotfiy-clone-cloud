import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/88 text-card-foreground shadow-2xl shadow-black/20 backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
