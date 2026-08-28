import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const permissions = ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_VIEW', 'ROLE_MANAGE', 'AUDIT_LOG_VIEW', 'WAREHOUSE_VIEW', 'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE', 'WAREHOUSE_DELETE', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE', 'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE', 'INVENTORY_VIEW', 'INVENTORY_MANAGE'];
const rolePermissions: Record<string, string[]> = { ADMIN: permissions, WAREHOUSE_MANAGER: ['ROLE_VIEW', 'WAREHOUSE_VIEW', 'WAREHOUSE_UPDATE', 'PRODUCT_VIEW', 'CATEGORY_VIEW', 'SUPPLIER_VIEW', 'INVENTORY_VIEW', 'INVENTORY_MANAGE'], INVENTORY_STAFF: ['WAREHOUSE_VIEW', 'PRODUCT_VIEW', 'CATEGORY_VIEW', 'SUPPLIER_VIEW', 'INVENTORY_VIEW', 'INVENTORY_MANAGE'], VIEWER: ['WAREHOUSE_VIEW', 'PRODUCT_VIEW', 'CATEGORY_VIEW', 'SUPPLIER_VIEW', 'INVENTORY_VIEW'] };

async function main() {
  const permissionRecords = new Map<string, string>();
  for (const name of permissions) { const permission = await prisma.permission.upsert({ where: { name }, update: {}, create: { name, description: `Permission to ${name.toLowerCase().replaceAll('_', ' ')}` } }); permissionRecords.set(name, permission.id); }
  for (const [name, assigned] of Object.entries(rolePermissions)) { const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name.replaceAll('_', ' ')} access` } }); for (const permission of assigned) await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permissionRecords.get(permission)! } }, update: {}, create: { roleId: role.id, permissionId: permissionRecords.get(permission)! } }); }
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.local'; const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error('SEED_ADMIN_PASSWORD must be set for development seeding');
  const admin = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const adminUser = await prisma.user.upsert({ where: { email }, update: { roleId: admin.id, isActive: true }, create: { name: 'Development Administrator', email, passwordHash: await argon2.hash(password), roleId: admin.id } });
  const warehouses = [{ code: 'WH-001', name: 'Main Warehouse', city: 'Central City' }, { code: 'WH-002', name: 'North Warehouse', city: 'North District' }, { code: 'WH-003', name: 'South Warehouse', city: 'South District' }];
  for (const warehouse of warehouses) await prisma.warehouse.upsert({ where: { code: warehouse.code }, update: warehouse, create: warehouse });
  const roots = ['Electronics', 'Furniture'];
  for (const name of roots) { const existing = await prisma.category.findFirst({ where: { name, parentId: null } }); const root = existing ?? await prisma.category.create({ data: { name } }); const children = name === 'Electronics' ? ['Laptops', 'Mobile Phones', 'Accessories'] : ['Chairs', 'Desks']; for (const child of children) await prisma.category.upsert({ where: { name_parentId: { name: child, parentId: root.id } }, update: {}, create: { name: child, parentId: root.id } }); }
  await prisma.supplier.upsert({ where: { code: 'SUP-001' }, update: {}, create: { code: 'SUP-001', name: 'Northstar Distribution', contactPerson: 'Morgan Lee', email: 'morgan@northstar.example' } });
  await prisma.supplier.upsert({ where: { code: 'SUP-002' }, update: {}, create: { code: 'SUP-002', name: 'Apex Components', contactPerson: 'Riley Chen', email: 'riley@apex.example' } });
  const laptops = await prisma.category.findFirstOrThrow({ where: { name: 'Laptops' } });
  const phones = await prisma.category.findFirstOrThrow({ where: { name: 'Mobile Phones' } });
  await prisma.product.upsert({ where: { sku: 'LAP-001' }, update: {}, create: { sku: 'LAP-001', name: 'Operations Laptop 14', brand: 'OptiTech', unit: 'unit', categoryId: laptops.id, costPrice: 620, sellingPrice: 899, price: 899, reorderLevel: 10, maximumStockLevel: 100 } });
  await prisma.product.upsert({ where: { sku: 'PHN-001' }, update: {}, create: { sku: 'PHN-001', name: 'Field Scanner Phone', brand: 'OptiTech', unit: 'unit', categoryId: phones.id, costPrice: 210, sellingPrice: 349, price: 349, reorderLevel: 20, maximumStockLevel: 200 } });
  const sampleProducts = ['LAP-002', 'LAP-003', 'PHN-002', 'ACC-001', 'ACC-002', 'CHR-001', 'CHR-002', 'DSK-001'];
  for (const [index, sku] of sampleProducts.entries()) await prisma.product.upsert({ where: { sku }, update: {}, create: { sku, name: `Warehouse Product ${index + 3}`, unit: 'unit', categoryId: index < 3 ? laptops.id : phones.id, costPrice: 25 + index * 10, sellingPrice: 50 + index * 15, price: 50 + index * 15, reorderLevel: 10, maximumStockLevel: 100 } });
  const seededProducts = await prisma.product.findMany({ where: { sku: { in: ['LAP-001', 'PHN-001', ...sampleProducts] } } });
  const seededWarehouses = await prisma.warehouse.findMany({ where: { code: { in: ['WH-001', 'WH-002', 'WH-003'] } } });
  for (const [warehouseIndex, warehouse] of seededWarehouses.entries()) for (const [productIndex, product] of seededProducts.entries()) { const quantity = warehouseIndex === 0 ? (productIndex === 2 ? 0 : productIndex === 3 ? 150 : 100) : warehouseIndex === 1 ? (productIndex % 3 === 0 ? 5 : 20) : 50; const existing = await prisma.inventory.findUnique({ where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } } }); if (!existing) { const inventory = await prisma.inventory.create({ data: { warehouseId: warehouse.id, productId: product.id, quantityOnHand: quantity, reorderLevel: product.reorderLevel, maximumStockLevel: product.maximumStockLevel } }); await prisma.stockTransaction.create({ data: { inventoryId: inventory.id, warehouseId: warehouse.id, productId: product.id, transactionType: 'INITIAL_STOCK', quantity, quantityBefore: 0, quantityAfter: quantity, reason: 'Development seed opening inventory', performedBy: adminUser.id } }); } }
  console.log(`Seeded roles and development administrator ${email}`);
}
main().finally(() => prisma.$disconnect());
