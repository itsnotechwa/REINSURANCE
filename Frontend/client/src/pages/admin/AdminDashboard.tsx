import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdminRoute } from '@/components/AdminRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, DollarSign, TrendingUp, Loader2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          api.getClaimsReport(),
          api.getUsers(),
        ]);
        setStats(statsData);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <AdminRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </AdminRoute>
    );
  }

  const statCards = [
    {
      title: 'Total Claims (System)',
      value: stats?.total_claims || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Fraudulent Claims',
      value: stats?.fraudulent_count || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Reserve',
      value: `$${stats?.avg_reserve?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  // Prepare data for status breakdown pie chart
  const statusData = stats?.status_breakdown
    ? Object.entries(stats.status_breakdown).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count as number,
      }))
    : [];

  const STATUS_COLORS = {
    Pending: '#94a3b8',
    Processed: '#3b82f6',
    Approved: '#10b981',
    Rejected: '#ef4444',
  };

  // Prepare data for fraud vs non-fraud comparison
  const fraudComparisonData = [
    {
      name: 'Fraudulent',
      count: stats?.fraudulent_count || 0,
    },
    {
      name: 'Legitimate',
      count: (stats?.total_claims || 0) - (stats?.fraudulent_count || 0),
    },
  ];

  // User role breakdown
  const userRoleData = users.reduce((acc: any[], user) => {
    const existing = acc.find((item) => item.name === user.role);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: user.role.charAt(0).toUpperCase() + user.role.slice(1), value: 1 });
    }
    return acc;
  }, []);

  const ROLE_COLORS = {
    Admin: '#8b5cf6',
    Insurer: '#3b82f6',
  };

  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              System-wide overview of claims processing and user management
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`h-10 w-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Claims by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#8884d8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fraud vs Legitimate Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fraudComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Claims" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROLE_COLORS[entry.name as keyof typeof ROLE_COLORS] || '#8884d8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status breakdown list */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.status_breakdown &&
                    Object.entries(stats.status_breakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              status === 'approved'
                                ? 'bg-success'
                                : status === 'rejected'
                                ? 'bg-destructive'
                                : status === 'processed'
                                ? 'bg-primary'
                                : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground capitalize">
                            {status}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {count as number}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/admin/users"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Users className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage all system users
                  </p>
                </a>
                <a
                  href="/admin/claims"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">All Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    View all claims across the system
                  </p>
                </a>
                <a
                  href="/admin/analytics"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">System Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced analytics and insights
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
}


