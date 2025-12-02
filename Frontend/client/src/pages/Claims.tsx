import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function Claims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      try {
        const params: any = { page, limit };
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        const data = await api.getClaims(params);
        setClaims(data.claims || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Failed to fetch claims:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [page, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: null },
      processed: { variant: 'default', icon: null },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const getFraudBadge = (isFraudulent: boolean, fraudScore: number) => {
    if (isFraudulent) {
      return (
        <Badge variant="destructive" className="bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Fraud Alert
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Score: {(fraudScore * 100).toFixed(0)}%
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Claims</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all processed claims
              </p>
            </div>
            <Link href="/upload">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Upload New Claim
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">
                  Filter by Status:
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Claims list */}
          <Card>
            <CardHeader>
              <CardTitle>
                Claims List ({total} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No claims found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <Link key={claim.id} href={`/claims/${claim.id}`}>
                      <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">
                                Claim #{claim.id}
                              </h3>
                              {getStatusBadge(claim.status)}
                              {claim.fraud_score !== undefined &&
                                getFraudBadge(claim.is_fraudulent, claim.fraud_score)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">File</p>
                                <p className="font-medium text-foreground truncate">
                                  {claim.pdf_filename}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium text-foreground">
                                  {new Date(claim.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {claim.reserve_estimate && (
                                <div>
                                  <p className="text-muted-foreground">Reserve</p>
                                  <p className="font-medium text-foreground">
                                    ${claim.reserve_estimate.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {claim.fraud_score !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">Fraud Score</p>
                                  <p className="font-medium text-foreground">
                                    {(claim.fraud_score * 100).toFixed(1)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
