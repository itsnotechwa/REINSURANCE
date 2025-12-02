import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ClaimDetail() {
  const [, params] = useRoute('/claims/:id');
  const [, setLocation] = useLocation();
  const [claim, setClaim] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const claimId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    const fetchClaimData = async () => {
      if (!claimId) return;

      setIsLoading(true);
      try {
        const [claimData, predictionData] = await Promise.all([
          api.getClaim(claimId),
          api.getPrediction(claimId).catch(() => null),
        ]);
        setClaim(claimData);
        setPrediction(predictionData);
      } catch (error) {
        console.error('Failed to fetch claim:', error);
        toast.error('Failed to load claim details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaimData();
  }, [claimId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!claimId) return;

    setIsUpdating(true);
    try {
      await api.updateClaimStatus(claimId, newStatus);
      setClaim({ ...claim, status: newStatus });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (!claim) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Claim not found</p>
            <Button onClick={() => setLocation('/claims')} className="mt-4">
              Back to Claims
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/claims')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                Claim #{claim.id}
              </h1>
              <p className="text-muted-foreground mt-1">
                Submitted on {new Date(claim.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">
                  Current Status:
                </label>
                <Select
                  value={claim.status}
                  onValueChange={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Analysis */}
          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle>Fraud Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`p-6 rounded-lg border-2 ${
                    prediction.is_fraudulent
                      ? 'bg-warning/5 border-warning'
                      : 'bg-success/5 border-success'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {prediction.is_fraudulent ? (
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-success" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {prediction.is_fraudulent
                          ? 'Potential Fraud Detected'
                          : 'No Fraud Detected'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Model Version: {prediction.model_version}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Fraud Score
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {(prediction.fraud_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Estimated Reserve
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        ${prediction.reserve_estimate?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {prediction.is_fraudulent && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Recommended Actions
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Review claim documentation thoroughly</li>
                      <li>Verify claimant information</li>
                      <li>Contact claimant for additional details</li>
                      <li>Consider escalating to fraud investigation team</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Extracted Data */}
          {claim.extracted_data && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(claim.extracted_data).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground capitalize mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-medium text-foreground">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {claim.pdf_filename}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded by User #{claim.user_id}
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
