import { create } from "zustand";
import { mockData } from "../data/mockData";

export type OrderType = "EMERGENCY" | "OVERDUE" | "DAILY";
export type SubOrderStatus =
    | "UNALLOCATED"
    | "PARTIAL"
    | "ALLOCATED"
    | "CREDIT_EXCEEDED";

export interface SubOrder {
    subOrderId: string;
    itemId: string;
    warehouseId: string;
    supplierId: string;
    requestQty: number;
    type: OrderType;
    createDate: string;
    customerId: string;
    remark: string;
    allocated: number;
    status: SubOrderStatus;
    resolvedWarehouseId?: string;
    resolvedSupplierId?: string;
    unitPrice?: number;
    totalValue?: number;
}

export interface Order {
    orderId: string;
    subOrders: SubOrder[];
}

export interface Warehouse {
    warehouseId: string;
    stock: number;
    note?: string;
}

export interface Supplier {
    supplierId: string;
    stock: number;
    note?: string;
}

export interface Customer {
    customerId: string;
    creditLimit: number;
    usedCredit: number;
}

export interface PriceTier {
    priceTier: string;
    percentage: number;
}

export interface Price {
    itemId: string;
    supplierId: string;
    basePrice: number;
    tiers: PriceTier[];
}

export interface AllocationLog {
    subOrderId: string;
    message: string;
    type: "success" | "warning" | "error";
}

/** Banker's Rounding (Round Half to Even) */
function bankersRound(value: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    const shifted = value * factor;
    const floor = Math.floor(shifted);
    const diff = shifted - floor;
    if (Math.abs(diff - 0.5) < 1e-10) {
        return (floor % 2 === 0 ? floor : floor + 1) / factor;
    }
    return Math.round(shifted) / factor;
}

function getUnitPrice(
    itemId: string,
    supplierId: string,
    orderType: OrderType,
    prices: Price[]
): number {
    const entry = prices.find(
        (p) => p.itemId === itemId && p.supplierId === supplierId
    );
    if (!entry) return 0;
    const tierKey: Record<OrderType, string> = {
        EMERGENCY: "EMERGENCY",
        OVERDUE: "OVER_DUE",
        DAILY: "DAILY",
    };
    const tier = entry.tiers.find((t) => t.priceTier === tierKey[orderType]);
    return bankersRound((entry.basePrice * (tier?.percentage ?? 100)) / 100);
}

interface AllocationState {
    orders: Order[];
    warehouses: Warehouse[];
    customers: Customer[];
    prices: Price[];
    logs: AllocationLog[];
    isAutoAllocating: boolean;
    autoAllocateDone: boolean;
    disabledButton: boolean;
    searchQuery: string;
    filterType: string;
    filterStatus: string;
    currentPage: number;
    pageSize: number;

    runAutoAllocation: () => void;
    manualAllocate: (subOrderId: string, qty: number) => string | null;
    setSearchQuery: (q: string) => void;
    setFilterType: (t: string) => void;
    setFilterStatus: (s: string) => void;
    setCurrentPage: (p: number) => void;
    resetAllocation: () => void;
    getFilteredSubOrders: () => (SubOrder & { orderId: string })[];
}

export const useAllocationStore = create<AllocationState>((set, get) => ({
    orders: JSON.parse(JSON.stringify(mockData.orders)),
    warehouses: JSON.parse(JSON.stringify(mockData.warehouses)),
    customers: JSON.parse(JSON.stringify(mockData.customers)),
    prices: mockData.prices as Price[],
    logs: [],
    isAutoAllocating: false,
    autoAllocateDone: false,
    disabledButton: false,
    searchQuery: "",
    filterType: "ALL",
    filterStatus: "ALL",
    currentPage: 1,
    pageSize: 20,

    runAutoAllocation: () => {
        set({ isAutoAllocating: true, logs: [], autoAllocateDone: false, disabledButton: true });

        setTimeout(() => {
            const state = get();
            const warehouses: Warehouse[] = JSON.parse(
                JSON.stringify(state.warehouses)
            );
            const customers: Customer[] = JSON.parse(
                JSON.stringify(state.customers)
            );
            const orders: Order[] = JSON.parse(JSON.stringify(state.orders));
            const logs: AllocationLog[] = [];

            // Flatten
            const flat: (SubOrder & { orderId: string })[] = orders.flatMap((o) =>
                o.subOrders.map((s) => ({ ...s, orderId: o.orderId }))
            );

            // Sort: EMERGENCY > OVERDUE > DAILY, then FIFO by createDate
            const priority: Record<OrderType, number> = {
                EMERGENCY: 0,
                OVERDUE: 1,
                DAILY: 2,
            };
            flat.sort((a, b) => {
                const p = priority[a.type] - priority[b.type];
                if (p !== 0) return p;
                return (
                    new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
                );
            });

            for (const sub of flat) {
                // Resolve WH-000 → highest stock real warehouse
                let resolvedWH = sub.warehouseId;
                if (sub.warehouseId === "WH-000") {
                    const best = warehouses
                        .filter((w) => w.warehouseId !== "WH-000")
                        .sort((a, b) => b.stock - a.stock)[0];
                    if (best) resolvedWH = best.warehouseId;
                }

                // Resolve SP-000 → highest stock real supplier
                let resolvedSP = sub.supplierId;
                if (sub.supplierId === "SP-000") {
                    const bestSP = (mockData.suppliers as Supplier[])
                        .filter((s) => s.supplierId !== "SP-000")
                        .sort((a, b) => b.stock - a.stock)[0];
                    if (bestSP) resolvedSP = bestSP.supplierId;
                }

                const unitPrice = getUnitPrice(
                    sub.itemId,
                    resolvedSP,
                    sub.type,
                    state.prices
                );

                const whEntry = warehouses.find((w) => w.warehouseId === resolvedWH);
                const customer = customers.find(
                    (c) => c.customerId === sub.customerId
                );

                const availStock = whEntry?.stock ?? 0;
                const creditRemaining = customer
                    ? customer.creditLimit - customer.usedCredit
                    : 0;

                if (availStock <= 0) {
                    sub.status = "UNALLOCATED";
                    logs.push({
                        subOrderId: sub.subOrderId,
                        message: `ไม่มี Stock ใน ${resolvedWH}`,
                        type: "error",
                    });
                    continue;
                }

                if (creditRemaining <= 0) {
                    sub.status = "CREDIT_EXCEEDED";
                    logs.push({
                        subOrderId: sub.subOrderId,
                        message: `${sub.customerId} เกิน Credit Limit`,
                        type: "error",
                    });
                    continue;
                }

                let allocQty = Math.min(sub.requestQty, availStock);
                if (unitPrice > 0) {
                    const maxByCredit = Math.floor(creditRemaining / unitPrice);
                    allocQty = Math.min(allocQty, maxByCredit);
                }
                allocQty = Math.max(0, allocQty);

                const totalValue = bankersRound(allocQty * unitPrice);

                sub.allocated = allocQty;
                sub.resolvedWarehouseId = resolvedWH;
                sub.resolvedSupplierId = resolvedSP;
                sub.unitPrice = unitPrice;
                sub.totalValue = totalValue;

                if (allocQty === 0) {
                    sub.status = "CREDIT_EXCEEDED";
                    logs.push({
                        subOrderId: sub.subOrderId,
                        message: `${sub.customerId} เครดิตไม่พอสำหรับ 1 หน่วย`,
                        type: "warning",
                    });
                } else if (allocQty < sub.requestQty) {
                    sub.status = "PARTIAL";
                    logs.push({
                        subOrderId: sub.subOrderId,
                        message: `Partial: จัดสรร ${allocQty}/${sub.requestQty} จาก ${resolvedWH}`,
                        type: "warning",
                    });
                } else {
                    sub.status = "ALLOCATED";
                    logs.push({
                        subOrderId: sub.subOrderId,
                        message: `สำเร็จ: ${allocQty} หน่วย จาก ${resolvedWH} (฿${totalValue.toLocaleString()})`,
                        type: "success",
                    });
                }

                if (whEntry) whEntry.stock -= allocQty;
                if (customer) customer.usedCredit = bankersRound(customer.usedCredit + totalValue);
            }

            // Write back resolved subs into orders
            for (const order of orders) {
                for (const sub of order.subOrders) {
                    const updated = flat.find((f) => f.subOrderId === sub.subOrderId);
                    if (updated) Object.assign(sub, updated);
                }
            }

            set({
                orders,
                warehouses,
                customers,
                logs,
                isAutoAllocating: false,
                autoAllocateDone: true,
                disabledButton: true,
            });
        }, 900);
    },

    manualAllocate: (subOrderId, qty) => {
        const state = get();
        const orders: Order[] = JSON.parse(JSON.stringify(state.orders));
        const warehouses: Warehouse[] = JSON.parse(JSON.stringify(state.warehouses));
        const customers: Customer[] = JSON.parse(JSON.stringify(state.customers));

        let targetSub: SubOrder | null = null;
        for (const order of orders) {
            const s = order.subOrders.find((x) => x.subOrderId === subOrderId);
            if (s) { targetSub = s; break; }
        }
        if (!targetSub) return "ไม่พบ Sub Order";

        const resolvedWH = targetSub.resolvedWarehouseId || targetSub.warehouseId;
        const resolvedSP = targetSub.resolvedSupplierId || targetSub.supplierId;
        const unitPrice = getUnitPrice(
            targetSub.itemId,
            resolvedSP,
            targetSub.type,
            state.prices
        );

        if (qty < 0) return "จำนวนต้องมากกว่าหรือเท่ากับ 0";
        if (qty > targetSub.requestQty)
            return `จำนวนเกิน Request Qty (${targetSub.requestQty})`;

        const whEntry = warehouses.find((w) => w.warehouseId === resolvedWH);
        const diff = qty - targetSub.allocated;
        if (diff > 0 && whEntry && diff > whEntry.stock)
            return `Stock ใน ${resolvedWH} ไม่เพียงพอ (คงเหลือ: ${whEntry.stock} หน่วย)`;

        const customer = customers.find((c) => c.customerId === targetSub!.customerId);
        if (customer && unitPrice > 0) {
            const creditWithout = customer.usedCredit - (targetSub.totalValue ?? 0);
            const newVal = bankersRound(qty * unitPrice);
            if (creditWithout + newVal > customer.creditLimit) {
                const avail = bankersRound(customer.creditLimit - creditWithout);
                return `เกิน Credit Limit ของ ${targetSub.customerId} (วงเงินคงเหลือ: ฿${avail.toLocaleString()})`;
            }
        }

        // Apply
        if (whEntry) whEntry.stock -= diff;
        if (customer) {
            customer.usedCredit = bankersRound(
                customer.usedCredit - (targetSub.totalValue ?? 0) + bankersRound(qty * unitPrice)
            );
        }

        for (const order of orders) {
            const sub = order.subOrders.find((s) => s.subOrderId === subOrderId);
            if (sub) {
                sub.allocated = qty;
                sub.unitPrice = unitPrice;
                sub.totalValue = bankersRound(qty * unitPrice);
                sub.resolvedWarehouseId = resolvedWH;
                sub.resolvedSupplierId = resolvedSP;
                sub.status =
                    qty === 0
                        ? "UNALLOCATED"
                        : qty < sub.requestQty
                            ? "PARTIAL"
                            : "ALLOCATED";
            }
        }

        set({ orders, warehouses, customers });
        return null;
    },

    setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
    setFilterType: (t) => set({ filterType: t, currentPage: 1 }),
    setFilterStatus: (s) => set({ filterStatus: s, currentPage: 1 }),
    setCurrentPage: (p) => set({ currentPage: p }),

    resetAllocation: () =>
        set({
            orders: JSON.parse(JSON.stringify(mockData.orders)),
            warehouses: JSON.parse(JSON.stringify(mockData.warehouses)),
            customers: JSON.parse(JSON.stringify(mockData.customers)),
            logs: [],
            autoAllocateDone: false,
            disabledButton: false,
        }),

    getFilteredSubOrders: () => {
        const { orders, searchQuery, filterType, filterStatus } = get();
        return orders
            .flatMap((o) => o.subOrders.map((s) => ({ ...s, orderId: o.orderId })))
            .filter((s) => {
                const q = searchQuery.toLowerCase();
                const matchSearch =
                    !q ||
                    s.subOrderId.toLowerCase().includes(q) ||
                    s.orderId.toLowerCase().includes(q) ||
                    s.customerId.toLowerCase().includes(q) ||
                    s.itemId.toLowerCase().includes(q);
                const matchType = filterType === "ALL" || s.type === filterType;
                const matchStatus =
                    filterStatus === "ALL" || s.status === filterStatus;
                return matchSearch && matchType && matchStatus;
            });
    },
}));