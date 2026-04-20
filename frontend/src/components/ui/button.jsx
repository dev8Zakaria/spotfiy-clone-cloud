import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    ghost: "hover:bg-muted text-foreground",
    outline: "border border-border bg-transparent hover:bg-muted"
  };
  const sizes = {
    default: "h-10 px-4",
    icon: "h-10 w-10",
    sm: "h-9 px-3"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
