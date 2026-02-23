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
    setSearch: (value: string) => void;
    setPage: (page: number) => void;
}