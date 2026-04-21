import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    ghost: "text-foreground hover:bg-muted",
    outline: "border border-border bg-background/35 hover:bg-muted",
    accent: "bg-accent text-accent-foreground shadow-lg shadow-accent/10 hover:bg-accent/90"
  };
  const sizes = {
    default: "h-10 px-4",
    icon: "h-10 w-10",
    sm: "h-9 px-3",
    lg: "h-12 px-5"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
