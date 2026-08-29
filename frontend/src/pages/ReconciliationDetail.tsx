import { useParams, useNavigate } from 'react-router-dom';
import { useReconciliation } from '@/hooks/useStockCounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const ReconciliationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: reconciliation, isLoading } = useReconciliation(id || '');

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!reconciliation) {
    return <div className="p-6">Reconciliation not found</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'EXECUTED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{reconciliation.reconciliationNumber}</h1>
          <p className="text-gray-600 mt-1">Stock Count: {reconciliation.countNumber}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/reconciliations')}>
          Back
        </Button>
      </div>

      {/* Header Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Warehouse</div>
            <div className="text-lg font-semibold mt-2">{reconciliation.warehouseName}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Status</div>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getStatusBadgeColor(reconciliation.status)}`}>
                {reconciliation.status}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Total Adjustment</div>
            <div className="text-lg font-semibold mt-2">
              {reconciliation.totalIncrease > 0 && (
                <span className="text-green-600">+{reconciliation.totalIncrease}</span>
              )}
              {reconciliation.totalDecrease > 0 && (
                <span className="text-red-600"> -{reconciliation.totalDecrease}</span>
              )}
              {reconciliation.totalIncrease === 0 && reconciliation.totalDecrease === 0 && (
                <span className="text-gray-600">No Adjustment</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Absolute Variance</div>
            <div className="text-lg font-semibold mt-2">{Math.abs(reconciliation.totalVariance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Info */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-600">Approved By</div>
              <div className="text-sm mt-1">{reconciliation.approvedByName || 'Pending'}</div>
              <div className="text-xs text-gray-500 mt-1">
                {reconciliation.approvedAt && new Date(reconciliation.approvedAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Executed By</div>
              <div className="text-sm mt-1">{reconciliation.executedByName || 'Pending'}</div>
              <div className="text-xs text-gray-500 mt-1">
                {reconciliation.executedAt && new Date(reconciliation.executedAt).toLocaleString()}
              </div>
            </div>
          </div>
          {reconciliation.notes && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-600">Notes</div>
              <div className="text-sm mt-2 whitespace-pre-wrap">{reconciliation.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustments Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-sm font-medium text-gray-600">Total Increases</div>
            <div className="text-3xl font-bold text-green-600 mt-2">+{reconciliation.totalIncrease}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <div className="text-sm font-medium text-gray-600">Total Decreases</div>
            <div className="text-3xl font-bold text-red-600 mt-2">-{reconciliation.totalDecrease}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Items Adjusted</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{reconciliation.items?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjusted Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">System Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Counted Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Adjustment</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.items?.map((item: any) => (
                  <tr key={item.productId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-gray-600">{item.productSku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.systemQuantity}</td>
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
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        item.adjustmentType === 'INCREASE' ? 'bg-green-100 text-green-800' :
                        item.adjustmentType === 'DECREASE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.adjustmentType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconciliationDetail;
