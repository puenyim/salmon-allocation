import { create } from "zustand";
import { mockData } from "../data/mockData";
import type { OrderState, RowData } from "../types";



const flattenOrders = (): RowData[] =>
    mockData.orders.flatMap((order: any) =>
        order.subOrders.map((sub: RowData) => ({
            orderId: order.orderId,
            subOrderId: sub.subOrderId,
            itemId: sub.itemId,
            warehouseId: sub.warehouseId,
            supplierId: sub.supplierId,
            requestQty: sub.requestQty,
            type: sub.type,
            createDate: sub.createDate,
            customerId: sub.customerId,
            remark: sub.remark
        }))
    );

export const useOrderStore = create<OrderState>((set) => ({
    rows: flattenOrders(),
    search: "",
    currentPage: 1,

    setSearch: (value) =>
        set({
            search: value,
            currentPage: 1 // reset page ตอน search
        }),

    setPage: (page) => set({ currentPage: page })
}));