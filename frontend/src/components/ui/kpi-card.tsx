import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, icon: Icon, description, trend, className }: KPICardProps) {
  return (
    <Card className={cn("relative overflow-hidden group hover:shadow-primary/5 hover:border-white/10", className)}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs mt-2 font-medium",
                trend.isPositive ? "text-emerald-400" : "text-destructive"
              )}>
                {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% from last month
              </div>
            )}
          </div>
          <div className={cn(
            "rounded-xl p-2.5 bg-primary/10 border border-primary/20 transition-all group-hover:bg-primary/15 group-hover:scale-110"
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
