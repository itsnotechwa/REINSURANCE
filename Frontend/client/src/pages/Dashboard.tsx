import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getClaimsReport();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const statCards = [
    {
      title: 'Total Claims',
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
      title: 'Avg Reserve',
      value: `$${stats?.avg_reserve?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Avg Fraud Score',
      value: `${((stats?.avg_fraud_score || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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

  // Mock trend data (in production, this would come from API)
  const trendData = [
    { month: 'Jan', claims: 45, fraudulent: 4 },
    { month: 'Feb', claims: 52, fraudulent: 5 },
    { month: 'Mar', claims: 48, fraudulent: 3 },
    { month: 'Apr', claims: 61, fraudulent: 7 },
    { month: 'May', claims: 55, fraudulent: 6 },
    { month: 'Jun', claims: 67, fraudulent: 8 },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of claims processing and fraud detection
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
          <div className="grid grid-cols-1 gap-6">
            {/* Claims Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Claims Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="claims"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total Claims"
                    />
                    <Line
                      type="monotone"
                      dataKey="fraudulent"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Fraudulent Claims"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/upload"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Upload Claim</h3>
                  <p className="text-sm text-muted-foreground">
                    Process a new claim document
                  </p>
                </a>
                <a
                  href="/claims"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">View Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse all processed claims
                  </p>
                </a>
                <a
                  href="/analytics"
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    View fraud trends and insights
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
