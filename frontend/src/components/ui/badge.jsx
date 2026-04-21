import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-primary/35 bg-primary/12 text-primary",
    secondary: "border-border bg-muted text-muted-foreground",
    accent: "border-accent/35 bg-accent/12 text-accent"
  };

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-bold uppercase tracking-[0.14em]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
