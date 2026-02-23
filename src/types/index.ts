// types/index.ts
export type OrderType = "EMERGENCY" | "OVERDUE" | "DAILY"

export interface Order {
    order: string;
    subOrder: string;
    itemId: string;
    warehouseId: string;
    supplierId: string;
    requestQty: number;
    type: OrderType;
    createDate: string;
    customerId: string;
}

export interface Allocation {
    subOrderId: string
    allocatedQty: number
    totalPrice: number
}

export type FilterState = {
    search: string;
    type: OrderType | 'All';
    dateFrom: string;
    dateTo: string;
};

export interface RowData {
    orderId: string;
    subOrderId: string;
    itemId: string;
    warehouseId: string;
    supplierId: string;
    requestQty: number;
    type: string;
    createDate: string;
    customerId: string;
    remark: string;
}

export interface OrderState {
    rows: RowData[];
    search: string;
    currentPage: number;
    filters: FilterState;
    setSearch: (value: string) => void;
    setPage: (page: number) => void;
    setFilters: (filters: FilterState) => void;
    allocations: Record<string, number>;
    updateAllocation: (subOrderId: string, qty: number) => void;
    autoAllocateAll: () => void;
}

export interface StockEntry {
    id: string;
    name: string;
    current: number;
    max: number;
}

export interface StockState {
    warehouseStock: StockEntry[];
    supplierStock: StockEntry[];
    updateStock: (type: 'warehouse' | 'supplier', id: string, delta: number) => void;
    startSimulation: () => void;
    stopSimulation: () => void;
}