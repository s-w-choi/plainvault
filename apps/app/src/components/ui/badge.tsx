import * as React from "react";
import { cn } from "./cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "color";
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
          variant === "secondary" ? "bg-gray-100 text-gray-700" :
          variant === "destructive" ? "bg-red-100 text-red-700" :
          variant === "outline" ? "border border-gray-300 text-gray-600 bg-white" :
          variant === "success" ? "bg-green-100 text-green-700" :
          variant === "warning" ? "bg-yellow-100 text-yellow-800" :
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

export type UserRole = "ADMIN" | "DEVELOPER" | "VIEWER";

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  role: UserRole;
}

function RoleBadge({ className, role, ...props }: RoleBadgeProps) {
  const variant = role === "ADMIN" ? "default" : role === "DEVELOPER" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className={cn("whitespace-nowrap", className)} {...props}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  );
}

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: UserStatus;
}

function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  const variant =
    status === "APPROVED" ? "success" :
    status === "REJECTED" ? "destructive" :
    status === "PENDING" ? "warning" :
    "secondary";
  const label =
    status === "APPROVED" ? "Approved" :
    status === "REJECTED" ? "Rejected" :
    status === "PENDING" ? "Pending" :
    status;
  return (
    <Badge variant={variant} className={cn("whitespace-nowrap", className)} {...props}>
      {label}
    </Badge>
  );
}

export interface CategoryBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color: string;
}

function CategoryBadge({ className, name, color, ...props }: CategoryBadgeProps) {
  return (
    <Badge variant="color" color={color} className={className} {...props}>
      {name}
    </Badge>
  );
}

export { Badge, RoleBadge, StatusBadge, CategoryBadge };