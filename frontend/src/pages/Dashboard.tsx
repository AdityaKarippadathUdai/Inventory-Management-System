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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your inventory and warehouse operations.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
          <KPICard title="Total Warehouses" value={warehouseCount} icon={Warehouse} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <KPICard title="Total Products" value={productCount.toLocaleString()} icon={Package} trend={{ value: 2.5, isPositive: true }} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <KPICard title="Total Inventory" value={(inventory?.data?.totalUnits ?? 0).toLocaleString()} icon={ArrowRightLeft} trend={{ value: 5.2, isPositive: true }} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <KPICard
            title="Low Stock Alerts"
            value={inventory?.data?.lowStock ?? 0}
            icon={AlertTriangle}
            className="border-destructive/20 hover:border-destructive/30"
            trend={{ value: 12, isPositive: false }}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Stock Movement</CardTitle>
            <CardDescription>Inbound vs Outbound stock over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStockMovement} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(value: number) => `${value / 1000}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'hsl(230 25% 10% / 0.95)',
                    backdropFilter: 'blur(12px)',
                    color: '#f1f5f9',
                    fontSize: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Bar dataKey="in" name="Inbound" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Outbound" fill="#374151" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Warehouse Distribution</CardTitle>
            <CardDescription>Inventory spread across active locations</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockWarehouseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {mockWarehouseDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'hsl(230 25% 10% / 0.95)',
                    backdropFilter: 'blur(12px)',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <CardDescription>Latest system transactions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-wider">Action</TableHead>
                <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-wider">Details</TableHead>
                <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentActivity.map((activity) => (
                <TableRow key={activity.id} className="border-white/5 hover:bg-white/3 transition-colors">
                  <TableCell className="font-medium">{activity.action}</TableCell>
                  <TableCell className="text-gray-400">{activity.details}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{activity.time}</TableCell>
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
