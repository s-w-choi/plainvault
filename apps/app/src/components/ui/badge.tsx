import * as React from "react";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "color";
  color?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", color, ...props }, ref) => {
    const isColorVariant = variant === "color" && color;
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 whitespace-nowrap",
          variant === "default" ? "bg-indigo-100 text-indigo-700" :
          variant === "secondary" ? "bg-gray-200 text-gray-900" :
          variant === "destructive" ? "bg-red-100 text-red-700" :
          variant === "outline" ? "border border-gray-300 text-gray-600" :
          variant === "success" ? "bg-green-100 text-green-700" :
          "",
          className
        )}
        style={isColorVariant ? {
          backgroundColor: color + "20",
          color: color,
          border: `1px solid ${color}40`,
        } : undefined}
        {...props}
      >
        {isColorVariant && (
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {props.children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
}

function RoleBadge({ className, role, ...props }: RoleBadgeProps) {
  const variant = role === "ADMIN" ? "default" : role === "DEVELOPER" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className={cn("whitespace-nowrap", className)} {...props}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  );
}

export { Badge, RoleBadge };