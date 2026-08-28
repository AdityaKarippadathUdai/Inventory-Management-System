export const mockKpis = {
  totalWarehouses: 12,
  totalProducts: 4250,
  totalInventory: 125000,
  lowStockItems: 145,
};

export const mockRecentActivity = [
  { id: '1', action: 'Transfer Completed', details: 'WH-East to WH-West', time: '10 mins ago', status: 'success' },
  { id: '2', action: 'Low Stock Alert', details: 'Product SKU-1029', time: '1 hour ago', status: 'warning' },
  { id: '3', action: 'Inventory Adjusted', details: 'Manual sync by John', time: '3 hours ago', status: 'info' },
  { id: '4', action: 'New Warehouse Added', details: 'WH-North', time: '1 day ago', status: 'success' },
];

export const mockWarehouseDistribution = [
  { name: 'WH-East', value: 45000 },
  { name: 'WH-West', value: 35000 },
  { name: 'WH-North', value: 25000 },
  { name: 'WH-South', value: 20000 },
];

export const mockStockMovement = [
  { name: 'Mon', in: 4000, out: 2400 },
  { name: 'Tue', in: 3000, out: 1398 },
  { name: 'Wed', in: 2000, out: 9800 },
  { name: 'Thu', in: 2780, out: 3908 },
  { name: 'Fri', in: 1890, out: 4800 },
  { name: 'Sat', in: 2390, out: 3800 },
  { name: 'Sun', in: 3490, out: 4300 },
];
