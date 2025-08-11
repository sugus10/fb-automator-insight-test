import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagementPoint } from "@/types/facebook";

interface EngagementChartProps {
  data: EngagementPoint[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Engagement Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200} className="sm:h-[250px] md:h-[300px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              className="sm:text-xs"
              tick={{ fontSize: 9 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              className="sm:text-xs"
              tick={{ fontSize: 9 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="engagement" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}