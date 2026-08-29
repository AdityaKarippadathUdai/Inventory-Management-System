import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateStockCount } from '@/hooks/useStockCounts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCountType } from '@/types/stock-counts';

export const StockCountCreate = () => {
  const navigate = useNavigate();
  const createCount = useCreateStockCount();

  const [formData, setFormData] = useState({
    warehouseId: '',
    countType: StockCountType.FULL,
    notes: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.warehouseId) {
      setError('Warehouse is required');
      return;
    }

    try {
      const result = await createCount.mutateAsync(formData);
      navigate(`/stock-counts/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create stock count');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Create Stock Count</h1>
        <p className="text-gray-600 mt-1">Start a new physical inventory count</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Count Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Warehouse <span className="text-red-600">*</span>
              </label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {/* This will be populated from your warehouse data */}
                  <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                  <SelectItem value="warehouse-2">Secondary Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Count Type <span className="text-red-600">*</span>
              </label>
              <Select
                value={formData.countType}
                onValueChange={(value: any) => setFormData({ ...formData, countType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StockCountType.FULL}>Full Physical Count</SelectItem>
                  <SelectItem value={StockCountType.PARTIAL}>Partial Count</SelectItem>
                  <SelectItem value={StockCountType.CYCLE}>Cycle Count</SelectItem>
                  <SelectItem value={StockCountType.SPOT_CHECK}>Spot Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Textarea
                placeholder="Add any notes about this count (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createCount.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createCount.isPending ? 'Creating...' : 'Create Stock Count'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/stock-counts')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCountCreate;
