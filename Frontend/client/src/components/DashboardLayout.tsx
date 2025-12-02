import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FileText,
  Upload,
  TrendingUp,
  Settings,
  LogOut,
  AlertTriangle,
  Users,
  BarChart3,
} from 'lucide-react';
import { APP_TITLE } from '@/const';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Claim', href: '/upload', icon: Upload },
    { name: 'Claims', href: '/claims', icon: FileText },
    { name: 'Fraud Analytics', href: '/analytics', icon: TrendingUp },
  ];

  // Admin-only navigation items
  const adminNavigation = isAdmin ? [
    { name: 'All Claims', href: '/admin/claims', icon: FileText },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3 },
  ] : [];

  // Combine navigation items
  const allNavigation = [...navigation, ...adminNavigation];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-xs text-muted-foreground">Claims Processing</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {allNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email}
                  </p>
                  {isAdmin && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
