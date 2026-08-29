import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useStockCount,
  useReconciliationPreview,
  useReconcileStockCount,
} from '@/hooks/useStockCounts';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const Reconciliation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: count, isLoading: isCountLoading } = useStockCount(id || '');
  const { data: preview, isLoading: isPreviewLoading } = useReconciliationPreview(id || '');
  const reconcile = useReconcileStockCount();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState('');

  if (!can('STOCK_COUNT_RECONCILE')) {
    return <div className="p-6 text-red-600">You don't have permission to reconcile counts</div>;
  }

  if (isCountLoading || isPreviewLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!count || count.status !== 'APPROVED') {
    return <div className="p-6">Stock count must be approved before reconciliation</div>;
  }

  if (!preview || !preview.items) {
    return <div className="p-6">Reconciliation preview not available</div>;
  }

  const handleReconcile = async () => {
    if (!id) return;
    try {
      setError('');
      await reconcile.mutateAsync({
        id,
        dto: {},
      });
      // After successful reconciliation, navigate to detail page
      navigate(`/stock-counts/${id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to execute reconciliation. Please check for conflicts with reserved stock.'
      );
    }
  };

  const totalIncreases = preview.items
    .filter((item: any) => item.adjustmentQuantity > 0)
    .reduce((sum: number, item: any) => sum + item.adjustmentQuantity, 0);

  const totalDecreases = preview.items
    .filter((item: any) => item.adjustmentQuantity < 0)
    .reduce((sum: number, item: any) => sum + Math.abs(item.adjustmentQuantity), 0);

  const criticalItems = preview.items.filter((item: any) => item.severity === 'CRITICAL').length;
  const highItems = preview.items.filter((item: any) => item.severity === 'HIGH').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{count.countNumber}</h1>
          <p className="text-gray-600 mt-1">Reconciliation Preview</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/stock-counts/${id}`)}>
          Back
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm border border-red-200">
          <div className="font-medium mb-1">Reconciliation Error</div>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Total Increases</div>
            <div className="text-2xl font-bold text-green-600 mt-2">+{totalIncreases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Total Decreases</div>
            <div className="text-2xl font-bold text-red-600 mt-2">-{totalDecreases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">High Severity</div>
            <div className="text-2xl font-bold text-orange-600 mt-2">{highItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Critical Severity</div>
            <div className="text-2xl font-bold text-red-600 mt-2">{criticalItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustments Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">System</th>
                  <th className="px-4 py-3 text-right font-semibold">Counted</th>
                  <th className="px-4 py-3 text-right font-semibold">Adjustment</th>
                  <th className="px-4 py-3 text-left font-semibold">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item: any) => (
                  <tr key={item.productId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-600">{item.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.currentStock}</td>
                    <td className="px-4 py-3 text-right">{item.countedQuantity}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        item.adjustmentQuantity > 0 ? 'text-green-600' :
                        item.adjustmentQuantity < 0 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {item.adjustmentQuantity > 0 ? '+' : ''}{item.adjustmentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(item.severity)}
                        <span className={`text-xs font-medium ${
                          item.severity === 'CRITICAL' ? 'text-red-600' :
                          item.severity === 'HIGH' ? 'text-orange-600' :
                          item.severity === 'MEDIUM' ? 'text-yellow-600' :
                          item.severity === 'LOW' ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.staleStatus === 'STALE' && (
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                          ⚠️ Stale Count
                        </span>
                      )}
                      {item.staleStatus === 'RESERVED_CONFLICT' && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 font-medium">
                          ⚠️ Reserved Conflict
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Warning Section */}
      {(criticalItems > 0 || highItems > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-orange-900">High Impact Adjustments Detected</div>
                <div className="text-sm text-orange-800 mt-1">
                  This reconciliation includes {criticalItems} critical and {highItems} high-severity variance items.
                  Please review carefully before proceeding.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end sticky bottom-6 bg-white p-4 rounded-lg border shadow">
        <Button variant="outline" onClick={() => navigate(`/stock-counts/${id}`)}>
          Cancel
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={reconcile.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Execute Reconciliation
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900">This action will:</p>
              <ul className="mt-2 ml-4 space-y-1 text-blue-900 list-disc">
                <li>Update inventory quantities based on physical count</li>
                <li>Create stock transactions for all adjustments</li>
                <li>Mark this count as completed</li>
                <li>Generate an audit trail of all changes</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReconcile}
                disabled={reconcile.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {reconcile.isPending ? 'Executing...' : 'Confirm & Execute'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reconciliation;
