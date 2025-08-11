import { DivideIcon as LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, icon: Icon, change, changeType = "neutral" }: StatCardProps) {
  const changeColorClass = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  }[changeType];

  return (
    <Card className="transition-smooth hover:shadow-facebook-md">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-all">{value}</p>
            {change && (
              <p className={`text-xs ${changeColorClass} mt-1`}>
                {change}
              </p>
            )}
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}