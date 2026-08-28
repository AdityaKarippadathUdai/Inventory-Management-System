import { Warehouse, Package, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRecentActivity, mockStockMovement, mockWarehouseDistribution } from "@/data/mock/dashboard";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary-foreground))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))'];

export function Dashboard() {
  const summary = useQuery({ queryKey: ["inventory-summary"], queryFn: () => apiClient.get("/inventory/summary") });
  const warehouses = useQuery({ queryKey: ["dashboard-warehouses"], queryFn: () => apiClient.get("/warehouses?limit=1") });
  const products = useQuery({ queryKey: ["dashboard-products"], queryFn: () => apiClient.get("/products?limit=1") });
  const inventory = summary.data as unknown as { data?: { totalUnits: number; lowStock: number; outOfStock: number } } | undefined;
  const warehouseCount = (warehouses.data as unknown as { meta?: { total?: number } } | undefined)?.meta?.total ?? 0;
  const productCount = (products.data as unknown as { meta?: { total?: number } } | undefined)?.meta?.total ?? 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your inventory and warehouse operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Warehouses" 
          value={warehouseCount} 
          icon={Warehouse} 
        />
        <KPICard 
          title="Total Products" 
          value={productCount.toLocaleString()} 
          icon={Package} 
          trend={{ value: 2.5, isPositive: true }}
        />
        <KPICard 
          title="Total Inventory" 
          value={(inventory?.data?.totalUnits ?? 0).toLocaleString()} 
          icon={ArrowRightLeft} 
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard 
          title="Low Stock Alerts" 
          value={inventory?.data?.lowStock ?? 0} 
          icon={AlertTriangle} 
          className="border-destructive/50 dark:border-destructive/30"
          trend={{ value: 12, isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Stock Movement</CardTitle>
            <CardDescription>Inbound vs Outbound stock over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStockMovement} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value / 1000}k`} />
                <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="in" name="Inbound" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Outbound" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Warehouse Distribution</CardTitle>
            <CardDescription>Inventory spread across active locations</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockWarehouseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {mockWarehouseDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system transactions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.action}</TableCell>
                  <TableCell>{activity.details}</TableCell>
                  <TableCell className="text-muted-foreground">{activity.time}</TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'destructive' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
