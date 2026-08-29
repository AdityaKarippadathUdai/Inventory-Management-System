import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useStockCount,
  useStartStockCount,
  useSubmitStockCount,
  useRejectStockCount,
  useApproveStockCount,
  useCancelStockCount,
} from '@/hooks/useStockCounts';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StockCountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: count, isLoading } = useStockCount(id || '');
  const startCount = useStartStockCount();
  const submitCount = useSubmitStockCount();
  const rejectCount = useRejectStockCount();
  const approveCount = useApproveStockCount();
  const cancelCount = useCancelStockCount();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const handleStart = async () => {
    if (!id) return;
    try {
      await startCount.mutateAsync({ id, dto: {} });
    } catch (err: any) {
      console.error('Failed to start count:', err);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitCount.mutateAsync({ id, dto: { notes: '' } });
    } catch (err: any) {
      console.error('Failed to submit count:', err);
    }
  };

  const handleReview = async () => {
    if (!id) return;
    try {
      // Review endpoint
      await fetch(`/api/v1/stock-counts/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // Refetch
    } catch (err: any) {
      console.error('Failed to review count:', err);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveCount.mutateAsync({ id, dto: { notes: '' } });
    } catch (err: any) {
      console.error('Failed to approve count:', err);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason) return;
    try {
      await rejectCount.mutateAsync({ id, dto: { reason: rejectReason } });
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (err: any) {
      console.error('Failed to reject count:', err);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelCount.mutateAsync({ id, dto: { reason: cancelReason } });
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err: any) {
      console.error('Failed to cancel count:', err);
    }
  };

  const handleStartCounting = () => {
    navigate(`/stock-counts/${id}/count`);
  };

  const handleReconcile = () => {
    navigate(`/stock-counts/${id}/reconciliation`);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!count) {
    return <div className="p-6">Stock count not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{count.countNumber}</h1>
          <p className="text-gray-600 mt-1">{count.warehouseName}</p>
        </div>
        <div className="flex gap-2">
          {can('STOCK_COUNT_EDIT') && count.status === 'DRAFT' && (
            <>
              <Button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
                Start Counting
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel
              </Button>
            </>
          )}
          {can('STOCK_COUNT_EDIT') && count.status === 'IN_PROGRESS' && (
            <>
              <Button onClick={handleStartCounting} className="bg-blue-600 hover:bg-blue-700">
                Continue Counting
              </Button>
              <Button onClick={handleSubmit} variant="outline">
                Submit for Review
              </Button>
            </>
          )}
          {can('STOCK_COUNT_REVIEW') && count.status === 'SUBMITTED' && (
            <>
              <Button onClick={handleReview} className="bg-purple-600 hover:bg-purple-700">
                Review
              </Button>
            </>
          )}
          {can('STOCK_COUNT_APPROVE') && count.status === 'UNDER_REVIEW' && (
            <>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                Reject
              </Button>
            </>
          )}
          {can('STOCK_COUNT_RECONCILE') && count.status === 'APPROVED' && (
            <Button onClick={handleReconcile} className="bg-emerald-600 hover:bg-emerald-700">
              Reconcile Inventory
            </Button>
          )}
        </div>
      </div>

      {/* Status and Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-gray-600">Status</div>
              <div className="text-lg font-semibold mt-1">{count.status}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Type</div>
              <div className="text-lg font-semibold mt-1">{count.countType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Items Counted</div>
              <div className="text-lg font-semibold mt-1">
                {count.items?.filter((i: any) => i.countedQuantity !== null).length || 0} / {count.itemCount}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">With Variance</div>
              <div className="text-lg font-semibold mt-1">{count.varianceItemCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">System Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Counted Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Variance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {count.items?.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.productSku}</td>
                    <td className="px-4 py-3 text-right">{item.systemQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.countedQuantity ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.countedQuantity !== null && (
                        <span className={item.varianceQuantity > 0 ? 'text-green-600 font-medium' : item.varianceQuantity < 0 ? 'text-red-600 font-medium' : ''}>
                          {item.varianceQuantity > 0 ? '+' : ''}{item.varianceQuantity} ({item.variancePercentage.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.severity && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          item.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          item.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          item.severity === 'LOW' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.severity}
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

      {/* Dialogs */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Stock Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason <span className="text-red-600">*</span></label>
              <Textarea
                placeholder="Explain why you're rejecting this count..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason || rejectCount.isPending}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Stock Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <Textarea
                placeholder="Why are you cancelling this count? (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Count
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelCount.isPending}
              >
                Cancel Count
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockCountDetail;
