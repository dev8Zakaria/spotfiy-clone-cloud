import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-xl shadow-black/10", className)}
      {...props}
    />
  );
}
