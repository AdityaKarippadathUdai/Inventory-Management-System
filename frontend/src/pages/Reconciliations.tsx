import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReconciliations } from '@/hooks/useStockCounts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export const ReconciliationsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const { data: reconciliationsData, isLoading } = useReconciliations(warehouseFilter, page, pageSize);

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
      <div>
        <h1 className="text-3xl font-bold">Reconciliations</h1>
        <p className="text-gray-600 mt-1">View all inventory reconciliation records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Warehouse</label>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Warehouses</SelectItem>
                  <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                  <SelectItem value="warehouse-2">Secondary Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliations Table */}
      <div className="rounded-lg border bg-white shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rec #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Count #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Warehouse</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Increases</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Decreases</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Executed By</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : reconciliationsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No reconciliations found
                  </td>
                </tr>
              ) : (
                reconciliationsData?.data?.map((rec: any) => (
                  <tr key={rec.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{rec.reconciliationNumber}</td>
                    <td className="px-6 py-4 font-medium">{rec.countNumber}</td>
                    <td className="px-6 py-4">{rec.warehouseName}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      +{rec.totalIncrease}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      -{rec.totalDecrease}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rec.executedByName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {rec.executedAt ? new Date(rec.executedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/reconciliations/${rec.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {reconciliationsData && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {reconciliationsData.data?.length || 0} of {reconciliationsData.total} reconciliations
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!reconciliationsData.data?.length || reconciliationsData.data.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationsPage;
