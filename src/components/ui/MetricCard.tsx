import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, subtitle, className = "", valueClassName = "" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border bg-white p-3 sm:p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="truncate text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-semibold ${valueClassName}`}>{value}</p>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
