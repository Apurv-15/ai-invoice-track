import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}: StatsCardProps) => {
  const variantStyles = {
    default: "from-primary/10 to-accent/10 border-primary/20",
    success: "from-success/10 to-success/5 border-success/20",
    warning: "from-warning/10 to-warning/5 border-warning/20",
    destructive: "from-destructive/10 to-destructive/5 border-destructive/20",
  };

  const iconStyles = {
    default: "bg-gradient-to-br from-primary to-accent",
    success: "bg-gradient-to-br from-success to-success/80",
    warning: "bg-gradient-to-br from-warning to-warning/80",
    destructive: "bg-gradient-to-br from-destructive to-destructive/80",
  };

  return (
    <div
      className={cn(
        "glass-card p-6 rounded-2xl smooth-transition hover:shadow-xl hover:scale-[1.02] animate-fade-in",
        "bg-gradient-to-br",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-2",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
            iconStyles[variant]
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};
