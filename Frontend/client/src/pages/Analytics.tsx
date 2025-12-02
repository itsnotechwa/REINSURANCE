import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

export default function Analytics() {
  const [trends, setTrends] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await api.getFraudTrends({ group_by: 'amount' });
        setTrends(data);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fraud Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Analyze fraud patterns and trends across claims
            </p>
          </div>

          {/* Fraud trends by amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fraud Trends by Claim Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends?.trends && trends.trends.length > 0 ? (
                <div className="space-y-4">
                  {trends.trends.map((trend: any, index: number) => {
                    const fraudRate =
                      trend.total_count > 0
                        ? (trend.fraud_count / trend.total_count) * 100
                        : 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              ${trend.range}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {trend.fraud_count} fraudulent out of {trend.total_count} total
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                              {fraudRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Fraud Rate
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              fraudRate > 50
                                ? 'bg-destructive'
                                : fraudRate > 25
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}
                            style={{ width: `${fraudRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No fraud trend data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    📊 Pattern Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The system continuously monitors claim patterns to identify
                    anomalies and potential fraud indicators across different claim
                    amount ranges.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    ⚠️ Risk Assessment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Higher fraud rates in certain amount ranges may indicate
                    systematic fraud attempts. Consider implementing additional
                    verification steps for claims in high-risk categories.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Model Performance
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The fraud detection model is continuously learning from new data
                    to improve accuracy and reduce false positives while maintaining
                    high detection rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
