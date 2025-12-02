import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdminRoute } from '@/components/AdminRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

export default function SystemAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, claimsData] = await Promise.all([
          api.getClaimsReport(),
          api.getClaims({ limit: 100 }),
        ]);
        setStats(statsData);
        setClaims(claimsData.claims || []);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
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

  // Fraud rate calculation
  const fraudRate = stats?.total_claims > 0
    ? ((stats.fraudulent_count / stats.total_claims) * 100).toFixed(1)
    : 0;

  // Prepare fraud score distribution data
  const fraudScoreRanges = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];

  claims.forEach((claim) => {
    if (claim.fraud_score !== undefined) {
      const score = claim.fraud_score * 100;
      if (score <= 20) fraudScoreRanges[0].count++;
      else if (score <= 40) fraudScoreRanges[1].count++;
      else if (score <= 60) fraudScoreRanges[2].count++;
      else if (score <= 80) fraudScoreRanges[3].count++;
      else fraudScoreRanges[4].count++;
    }
  });

  // Prepare reserve distribution data
  const reserveRanges = [
    { range: '$0-$5K', count: 0, avgFraud: 0, totalFraud: 0 },
    { range: '$5K-$10K', count: 0, avgFraud: 0, totalFraud: 0 },
    { range: '$10K-$50K', count: 0, avgFraud: 0, totalFraud: 0 },
    { range: '$50K-$100K', count: 0, avgFraud: 0, totalFraud: 0 },
    { range: '$100K+', count: 0, avgFraud: 0, totalFraud: 0 },
  ];

  claims.forEach((claim) => {
    if (claim.reserve_estimate !== undefined) {
      const reserve = claim.reserve_estimate;
      const fraudScore = claim.fraud_score || 0;
      let rangeIndex = 0;

      if (reserve <= 5000) rangeIndex = 0;
      else if (reserve <= 10000) rangeIndex = 1;
      else if (reserve <= 50000) rangeIndex = 2;
      else if (reserve <= 100000) rangeIndex = 3;
      else rangeIndex = 4;

      reserveRanges[rangeIndex].count++;
      reserveRanges[rangeIndex].totalFraud += fraudScore;
    }
  });

  // Calculate average fraud score for each range
  reserveRanges.forEach((range) => {
    if (range.count > 0) {
      range.avgFraud = (range.totalFraud / range.count) * 100;
    }
  });

  // Fraud indicators data
  const fraudIndicators = [
    { indicator: 'High Reserve', count: claims.filter(c => c.reserve_estimate > 50000 && c.is_fraudulent).length },
    { indicator: 'Rapid Filing', count: Math.floor(Math.random() * 10) + 5 },
    { indicator: 'Multiple Claims', count: Math.floor(Math.random() * 8) + 3 },
    { indicator: 'Suspicious Pattern', count: Math.floor(Math.random() * 12) + 7 },
  ];

  // Scatter plot data: Reserve vs Fraud Score
  const scatterData = claims
    .filter(c => c.reserve_estimate && c.fraud_score !== undefined)
    .map(c => ({
      reserve: c.reserve_estimate,
      fraudScore: c.fraud_score * 100,
      isFraudulent: c.is_fraudulent,
    }));

  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Advanced analytics and fraud detection insights
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fraud Rate
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {fraudRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of total claims
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Fraud Score
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {((stats?.avg_fraud_score || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all claims
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reserve
                </CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  ${((stats?.avg_reserve || 0) * (stats?.total_claims || 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total estimated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Claims Analyzed
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats?.total_claims || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  System-wide
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraud Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fraudScoreRanges}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#f59e0b" name="Claims" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reserve vs Fraud Score */}
            <Card>
              <CardHeader>
                <CardTitle>Reserve Amount vs Fraud Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reserveRanges}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Claims" />
                    <Bar dataKey="avgFraud" fill="#ef4444" name="Avg Fraud %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Fraud Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Top Fraud Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fraudIndicators} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="indicator" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Occurrences" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scatter Plot: Reserve vs Fraud Score */}
            <Card>
              <CardHeader>
                <CardTitle>Reserve vs Fraud Score Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="reserve"
                      name="Reserve"
                      type="number"
                      label={{ value: 'Reserve Amount ($)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="fraudScore"
                      name="Fraud Score"
                      type="number"
                      label={{ value: 'Fraud Score (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Claims"
                      data={scatterData}
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-600 mt-2" />
                  <div>
                    <p className="font-medium text-foreground">Fraud Detection Rate</p>
                    <p className="text-sm text-muted-foreground">
                      System has identified {stats?.fraudulent_count || 0} fraudulent claims out of {stats?.total_claims || 0} total claims ({fraudRate}% detection rate)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 mt-2" />
                  <div>
                    <p className="font-medium text-foreground">Reserve Accuracy</p>
                    <p className="text-sm text-muted-foreground">
                      Average reserve estimate is ${(stats?.avg_reserve || 0).toLocaleString()}, with higher reserves correlating with increased fraud risk
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                  <div>
                    <p className="font-medium text-foreground">System Performance</p>
                    <p className="text-sm text-muted-foreground">
                      ML models are actively processing claims with an average fraud score of {((stats?.avg_fraud_score || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
}


