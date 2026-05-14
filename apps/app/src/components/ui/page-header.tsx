import * as React from "react";
import { cn } from "./cn";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  gradient?: boolean;
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, gradient = false, actions, children, ...props }, ref) => {
    if (gradient) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 py-5",
            className
          )}
          {...props}
        >
          <div className="absolute top-2 right-8 w-24 h-24 bg-purple-100 rounded-full blur-3xl opacity-40" />
          <div className="relative">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between mb-6", className)}
        {...props}
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {children}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
