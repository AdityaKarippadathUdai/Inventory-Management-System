import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCount, useUpdateCountItem } from '@/hooks/useStockCounts';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const StockCountEntry = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: count, isLoading, refetch } = useStockCount(id || '');
  const updateItem = useUpdateCountItem();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  if (!can('STOCK_COUNT_EDIT')) {
    return <div className="p-6 text-red-600">You don't have permission to edit counts</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!count || count.status !== 'IN_PROGRESS') {
    return <div className="p-6">Invalid count status for editing</div>;
  }

  const handleStartEdit = (itemId: string, currentValue: number | null) => {
    setEditingItemId(itemId);
    setEditValues({ [itemId]: currentValue ?? 0 });
  };

  const handleSaveItem = async (itemId: string) => {
    if (!id) return;
    try {
      const value = editValues[itemId];
      if (value < 0) {
        alert('Quantity cannot be negative');
        return;
      }
      await updateItem.mutateAsync({
        countId: id,
        itemId,
        dto: { countedQuantity: value, notes: '' },
      });
      setEditingItemId(null);
      setEditValues({});
      await refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save item');
    }
  };

  const filteredItems = count.items?.filter((item: any) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productSku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const countedItems = count.items?.filter((i: any) => i.countedQuantity !== null).length || 0;
  const progressPercentage = Math.round((countedItems / (count.itemCount || 1)) * 100);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{count.countNumber}</h1>
          <p className="text-gray-600 mt-1">Enter physical inventory quantities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/stock-counts/${id}`)}>
            Back
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Counting Progress</div>
                <div className="text-2xl font-bold mt-1">
                  {countedItems} / {count.itemCount} items
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{progressPercentage}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div>
        <Input
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>

      {/* Items Grid */}
      <div className="grid gap-4">
        {filteredItems.map((item: any) => {
          const isEditing = editingItemId === item.id;
          const isComplete = item.countedQuantity !== null;
          const hasVariance = isComplete && item.varianceQuantity !== 0;

          return (
            <Card key={item.id} className={`${isComplete ? 'border-green-200 bg-green-50' : ''}`}>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4 items-start">
                  {/* Product Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start gap-2">
                      {hasVariance && getSeverityIcon(item.severity)}
                      <div>
                        <div className="font-medium text-lg">{item.productName}</div>
                        <div className="text-sm text-gray-600">SKU: {item.productSku}</div>
                        <div className="text-sm text-gray-600">System Qty: {item.systemQuantity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        value={editValues[item.id] ?? 0}
                        onChange={(e) => setEditValues({ [item.id]: parseInt(e.target.value) || 0 })}
                        autoFocus
                        placeholder="0"
                        className="text-lg font-semibold text-center"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {isComplete ? item.countedQuantity : '-'}
                        </div>
                        <div className="text-xs text-gray-600">Counted Qty</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItemId(null);
                            setEditValues({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveItem(item.id)}
                          disabled={updateItem.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(item.id, item.countedQuantity)}
                      >
                        {isComplete ? 'Edit' : 'Enter'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Variance Info */}
                {isComplete && hasVariance && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          {item.varianceQuantity > 0 ? 'Over' : 'Under'}-counted by {Math.abs(item.varianceQuantity)} units
                        </span>
                        <span className="text-gray-600 ml-2">({item.variancePercentage.toFixed(1)}%)</span>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        item.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        item.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        item.severity === 'LOW' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600">No items found matching your search</div>
        </div>
      )}

      {/* Save Complete Button */}
      <div className="flex gap-2 justify-end sticky bottom-6 bg-white p-4 rounded-lg border shadow">
        <Button variant="outline" onClick={() => navigate(`/stock-counts/${id}`)}>
          Back to Count
        </Button>
        {countedItems === count.itemCount && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">All items counted!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCountEntry;
