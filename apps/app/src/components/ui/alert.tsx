import * as React from "react";
import { cn } from "./cn";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "error" | "success" | "warning" | "info";
}

const variantStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-700",
} as const;

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "error", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

export { Alert };
