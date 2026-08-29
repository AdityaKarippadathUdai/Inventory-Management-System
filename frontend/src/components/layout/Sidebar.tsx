import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Warehouse, 
  Package, 
  Tags,
  ArrowRightLeft, 
  CalendarClock, 
  ClipboardCheck, 
  Truck, 
  ShoppingCart, 
  Undo2, 
  BarChart3, 
  PieChart, 
  Bell, 
  History, 
  Settings 
} from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Warehouses", href: "/warehouses", icon: Warehouse },
  { title: "Products", href: "/products", icon: Package },
  { title: "Categories", href: "/categories", icon: Tags },
  { title: "Inventory", href: "/inventory", icon: ClipboardCheck },
  { title: "Transfers", href: "/transfers", icon: ArrowRightLeft },
  { title: "Reservations", href: "/reservations", icon: CalendarClock },
  { title: "Reconciliation", href: "/reconciliation", icon: ClipboardCheck },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { title: "Returns", href: "/returns", icon: Undo2 },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Analytics", href: "/analytics", icon: PieChart },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Audit Logs", href: "/audit-logs", icon: History },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <Package className="h-6 w-6 text-primary" />
            <span>OptiStock</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-white bg-primary/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" 
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                )}
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-300")} />
                {item.title}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  );
}
