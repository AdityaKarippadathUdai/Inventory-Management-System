import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type {
  CreateStockCountDto,
  UpdateCountItemDto,
  SubmitStockCountDto,
  ApproveStockCountDto,
  RejectStockCountDto,
  ReopenStockCountDto,
  CancelStockCountDto,
} from '@/types/stock-counts';

export const useStockCounts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['stockCounts', page, pageSize],
    queryFn: () =>
      apiClient.get(`/stock-counts`, { params: { page, pageSize } }).then((res) => res.data),
  });
};

export const useStockCount = (id: string) => {
  return useQuery({
    queryKey: ['stockCount', id],
    queryFn: () => apiClient.get(`/stock-counts/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStockCountDto) =>
      apiClient.post('/stock-counts', dto).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useStartStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      apiClient.post(`/stock-counts/${id}/start`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useUpdateCountItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countId, itemId, dto }: { countId: string; itemId: string; dto: UpdateCountItemDto }) =>
      apiClient.patch(`/stock-counts/${countId}/items/${itemId}`, dto).then((res) => res.data),
    onSuccess: (_, { countId }) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', countId] });
    },
  });
};

export const useSubmitStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SubmitStockCountDto }) =>
      apiClient.post(`/stock-counts/${id}/submit`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useReviewStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      apiClient.post(`/stock-counts/${id}/review`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useApproveStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ApproveStockCountDto }) =>
      apiClient.post(`/stock-counts/${id}/approve`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useRejectStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RejectStockCountDto }) =>
      apiClient.post(`/stock-counts/${id}/reject`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useReopenStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReopenStockCountDto }) =>
      apiClient.post(`/stock-counts/${id}/reopen`, dto).then((res: any) => res.data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useCancelStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CancelStockCountDto }) =>
      apiClient.post(`/stock-counts/${id}/cancel`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
    },
  });
};

export const useVarianceReport = (page = 1, pageSize = 20, filters?: any) => {
  return useQuery({
    queryKey: ['varianceReport', page, pageSize, filters],
    queryFn: () =>
      apiClient
        .get(`/stock-counts/report/variances`, { params: { page, pageSize, ...filters } })
        .then((res) => res.data),
  });
};

export const useVarianceSummary = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['varianceSummary', warehouseId],
    queryFn: () =>
      apiClient
        .get(`/stock-counts/report/variance-summary`, { params: warehouseId ? { warehouseId } : {} })
        .then((res) => res.data),
  });
};

export const useReconciliationPreview = (countId: string) => {
  return useQuery({
    queryKey: ['reconciliationPreview', countId],
    queryFn: () =>
      apiClient.get(`/stock-counts/${countId}/reconciliation-preview`).then((res) => res.data),
    enabled: !!countId,
  });
};

export const useReconcileStockCount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      apiClient.post(`/stock-counts/${id}/reconcile`, dto).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockCount', data.stockCountId] });
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });
};

export const useReconciliations = (warehouseId?: string, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['reconciliations', warehouseId, page, pageSize],
    queryFn: () =>
      apiClient
        .get(`/reconciliations`, {
          params: {
            ...(warehouseId && { warehouseId }),
            page,
            pageSize,
          },
        })
        .then((res) => res.data),
  });
};

export const useReconciliation = (id: string) => {
  return useQuery({
    queryKey: ['reconciliation', id],
    queryFn: () => apiClient.get(`/reconciliations/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};
