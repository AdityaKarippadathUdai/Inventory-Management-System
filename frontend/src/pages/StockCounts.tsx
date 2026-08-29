import { useState } from 'react';
import { useStockCounts, useVarianceSummary } from '@/hooks/useStockCounts';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const StockCounts = () => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({ search: '', status: '', countType: '' });

  const { data: countsData, isLoading: isCountsLoading } = useStockCounts(page, pageSize);
  const { data: summaryData } = useVarianceSummary();

  const handleCreateCount = () => {
    navigate('/stock-counts/new');
  };

  const handleViewCount = (id: string) => {
    navigate(`/stock-counts/${id}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'UNDER_REVIEW':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Counts</h1>
          <p className="text-gray-600">Manage physical inventory counting and reconciliation</p>
        </div>
        {can('STOCK_COUNT_CREATE') && (
          <Button onClick={handleCreateCount} className="bg-blue-600 hover:bg-blue-700">
            New Stock Count
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      {summaryData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow">
            <div className="text-sm font-medium text-gray-600">Total Counted</div>
            <div className="text-2xl font-bold mt-2">{summaryData.totalItemsCounted}</div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow">
            <div className="text-sm font-medium text-gray-600">With Variance</div>
            <div className="text-2xl font-bold mt-2">{summaryData.itemsWithVariance}</div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow">
            <div className="text-sm font-medium text-gray-600">Total Increase</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              +{summaryData.totalPositiveVariance}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow">
            <div className="text-sm font-medium text-gray-600">Critical Variance</div>
            <div className="text-2xl font-bold text-red-600 mt-2">
              {summaryData.criticalSeverityItems}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Input
            placeholder="Search by count number..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select value={filters.status} onValueChange={(value: string) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.countType} onValueChange={(value: string) => setFilters({ ...filters, countType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="CYCLE">Cycle</SelectItem>
              <SelectItem value="SPOT_CHECK">Spot Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Counts Table */}
      <div className="rounded-lg border bg-white shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Count #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Warehouse</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Severity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Created By</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isCountsLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : countsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No stock counts found
                  </td>
                </tr>
              ) : (
                countsData?.data?.map((count: any) => (
                  <tr key={count.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{count.countNumber}</td>
                    <td className="px-6 py-4">{count.warehouseName}</td>
                    <td className="px-6 py-4 text-sm">{count.countType}</td>
                    <td className="px-6 py-4 text-sm">{count.itemCount}</td>
                    <td className="px-6 py-4 text-sm">
                      {count.criticalSeverityCount > 0 && (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          {count.criticalSeverityCount} Critical
                        </span>
                      )}
                      {count.highSeverityCount > 0 && (
                        <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          {count.highSeverityCount} High
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(count.status)}`}>
                        {count.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{count.createdByName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(count.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCount(count.id)}
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
      {countsData && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {countsData.data?.length || 0} of {countsData.total} counts
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
              disabled={!countsData.data?.length || countsData.data.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCounts;
