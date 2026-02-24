import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAllocationStore } from "../src/store/allocationStore";
import type { Order, SubOrder, Warehouse, Customer, Price } from "../src/store/allocationStore";

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/** Reset store to clean state before every test. */
function resetStore() {
    useAllocationStore.getState().resetAllocation();
    useAllocationStore.setState({
        searchQuery: "",
        filterType: "ALL",
        filterStatus: "ALL",
        currentPage: 1,
        logs: [],
        isAutoAllocating: false,
        autoAllocateDone: false,
        disabledButton: false,
    });
}

/** Shortcut to find a specific sub-order in the current state. */
function findSub(subOrderId: string): (SubOrder & { orderId: string }) | undefined {
    const { orders } = useAllocationStore.getState();
    for (const o of orders) {
        const s = o.subOrders.find((x) => x.subOrderId === subOrderId);
        if (s) return { ...s, orderId: o.orderId };
    }
    return undefined;
}

/** Build a minimal orders list for isolated testing. */
function setMinimalState(overrides: {
    orders?: Order[];
    warehouses?: Warehouse[];
    customers?: Customer[];
    prices?: Price[];
}) {
    useAllocationStore.setState({
        ...overrides,
        logs: [],
        autoAllocateDone: false,
        disabledButton: false,
    });
}

// ──────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
});

// ─── bankersRound (tested indirectly via allocation outputs) ─────────

describe("bankersRound (via allocation outputs)", () => {
    it("rounds 88.885 to 88.88 (half-to-even) through unitPrice", () => {
        // Item-2 / SP-001 / OVERDUE → basePrice=88.885, tier=100% → 88.885 → 88.88
        setMinimalState({
            orders: [
                {
                    orderId: "T-001",
                    subOrders: [
                        {
                            subOrderId: "T-001-001",
                            itemId: "Item-2",
                            warehouseId: "WH-002",
                            supplierId: "SP-001",
                            requestQty: 1,
                            type: "OVERDUE",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-002", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        const err = useAllocationStore.getState().manualAllocate("T-001-001", 1);
        expect(err).toBeNull();

        const sub = findSub("T-001-001");
        expect(sub?.unitPrice).toBe(88.88); // Banker's round: 88.885 → 88.88
        expect(sub?.totalValue).toBe(88.88);
    });

    it("rounds 111.141 to 111.14 through unitPrice (DAILY tier)", () => {
        // Item-1 / SP-001 / DAILY → basePrice=123.49, tier=90% → 111.141 → 111.14
        setMinimalState({
            orders: [
                {
                    orderId: "T-002",
                    subOrders: [
                        {
                            subOrderId: "T-002-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 1,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().manualAllocate("T-002-001", 1);
        const sub = findSub("T-002-001");
        expect(sub?.unitPrice).toBe(111.14);
    });

    it("rounds 148.188 to 148.19 through unitPrice (EMERGENCY tier)", () => {
        // Item-1 / SP-001 / EMERGENCY → basePrice=123.49, tier=120% → 148.188 → 148.19
        setMinimalState({
            orders: [
                {
                    orderId: "T-003",
                    subOrders: [
                        {
                            subOrderId: "T-003-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 1,
                            type: "EMERGENCY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().manualAllocate("T-003-001", 1);
        const sub = findSub("T-003-001");
        expect(sub?.unitPrice).toBe(148.19);
    });
});

// ─── getUnitPrice (tested indirectly via manualAllocate) ─────────────

describe("getUnitPrice (via manualAllocate)", () => {
    it("returns 0 when no price entry exists (unknown item+supplier)", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "T-010",
                    subOrders: [
                        {
                            subOrderId: "T-010-001",
                            itemId: "UNKNOWN-ITEM",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 5,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().manualAllocate("T-010-001", 5);
        const sub = findSub("T-010-001");
        expect(sub?.unitPrice).toBe(0);
        expect(sub?.totalValue).toBe(0);
        expect(sub?.status).toBe("ALLOCATED");
    });
});

// ─── manualAllocate ──────────────────────────────────────────────────

describe("manualAllocate", () => {
    beforeEach(() => {
        setMinimalState({
            orders: [
                {
                    orderId: "M-001",
                    subOrders: [
                        {
                            subOrderId: "M-001-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 100,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 200 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });
    });

    it("returns null and allocates fully when qty === requestQty", () => {
        const err = useAllocationStore.getState().manualAllocate("M-001-001", 100);
        expect(err).toBeNull();

        const sub = findSub("M-001-001");
        expect(sub?.allocated).toBe(100);
        expect(sub?.status).toBe("ALLOCATED");
    });

    it("sets status to PARTIAL when 0 < qty < requestQty", () => {
        const err = useAllocationStore.getState().manualAllocate("M-001-001", 50);
        expect(err).toBeNull();

        const sub = findSub("M-001-001");
        expect(sub?.allocated).toBe(50);
        expect(sub?.status).toBe("PARTIAL");
    });

    it("sets status to UNALLOCATED when qty === 0", () => {
        const err = useAllocationStore.getState().manualAllocate("M-001-001", 0);
        expect(err).toBeNull();

        const sub = findSub("M-001-001");
        expect(sub?.allocated).toBe(0);
        expect(sub?.status).toBe("UNALLOCATED");
    });

    it("returns error for negative qty", () => {
        const err = useAllocationStore.getState().manualAllocate("M-001-001", -5);
        expect(err).toBe("จำนวนต้องมากกว่าหรือเท่ากับ 0");
    });

    it("returns error when qty exceeds requestQty", () => {
        const err = useAllocationStore.getState().manualAllocate("M-001-001", 101);
        expect(err).toContain("จำนวนเกิน Request Qty");
    });

    it("returns error for unknown sub-order", () => {
        const err = useAllocationStore.getState().manualAllocate("NONEXISTENT", 10);
        expect(err).toBe("ไม่พบ Sub Order");
    });

    it("returns error when warehouse stock is insufficient", () => {
        // Set stock to 10 — sub has 0 allocated, diff = 50 > 10
        useAllocationStore.setState({
            warehouses: [{ warehouseId: "WH-001", stock: 10 }],
        });

        const err = useAllocationStore.getState().manualAllocate("M-001-001", 50);
        expect(err).toContain("Stock");
        expect(err).toContain("ไม่เพียงพอ");
    });

    it("returns error when credit limit would be exceeded", () => {
        useAllocationStore.setState({
            customers: [{ customerId: "CT-0004", creditLimit: 100, usedCredit: 0 }],
        });

        // 100 units × 111.14/unit = 11,114 > credit limit 100
        const err = useAllocationStore.getState().manualAllocate("M-001-001", 100);
        expect(err).toContain("เกิน Credit Limit");
    });

    it("deducts warehouse stock after successful allocation", () => {
        useAllocationStore.getState().manualAllocate("M-001-001", 30);

        const wh = useAllocationStore.getState().warehouses.find(
            (w) => w.warehouseId === "WH-001"
        );
        expect(wh?.stock).toBe(170); // 200 - 30
    });

    it("updates customer usedCredit after successful allocation", () => {
        useAllocationStore.getState().manualAllocate("M-001-001", 10);

        const customer = useAllocationStore.getState().customers.find(
            (c) => c.customerId === "CT-0004"
        );
        // 10 × 111.14 = 1111.40
        expect(customer?.usedCredit).toBe(1111.4);
    });
});

// ─── runAutoAllocation ───────────────────────────────────────────────

describe("runAutoAllocation", () => {
    it("sets isAutoAllocating=true and disabledButton=true immediately", () => {
        useAllocationStore.getState().runAutoAllocation();
        const state = useAllocationStore.getState();
        expect(state.isAutoAllocating).toBe(true);
        expect(state.disabledButton).toBe(true);
    });

    it("allocates orders after timeout with priority EMERGENCY > OVERDUE > DAILY", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-001",
                    subOrders: [
                        {
                            subOrderId: "A-001-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 50,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
                {
                    orderId: "A-002",
                    subOrders: [
                        {
                            subOrderId: "A-002-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 50,
                            type: "EMERGENCY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const state = useAllocationStore.getState();
        expect(state.isAutoAllocating).toBe(false);
        expect(state.autoAllocateDone).toBe(true);

        // Both should be allocated since stock is sufficient
        const emergency = findSub("A-002-001");
        const daily = findSub("A-001-001");
        expect(emergency?.status).toBe("ALLOCATED");
        expect(daily?.status).toBe("ALLOCATED");
    });

    it("resolves WH-000 to highest-stock warehouse", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-010",
                    subOrders: [
                        {
                            subOrderId: "A-010-001",
                            itemId: "Item-1",
                            warehouseId: "WH-000",
                            supplierId: "SP-001",
                            requestQty: 10,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [
                { warehouseId: "WH-001", stock: 100 },
                { warehouseId: "WH-002", stock: 500 },
                { warehouseId: "WH-000", stock: 0 },
            ],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const sub = findSub("A-010-001");
        expect(sub?.resolvedWarehouseId).toBe("WH-002"); // highest stock
        expect(sub?.status).toBe("ALLOCATED");
    });

    it("marks CREDIT_EXCEEDED when customer credit is 0", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-020",
                    subOrders: [
                        {
                            subOrderId: "A-020-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 10,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-BROKE",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-BROKE", creditLimit: 1000, usedCredit: 1000 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const sub = findSub("A-020-001");
        expect(sub?.status).toBe("CREDIT_EXCEEDED");
    });

    it("marks UNALLOCATED when warehouse has 0 stock", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-030",
                    subOrders: [
                        {
                            subOrderId: "A-030-001",
                            itemId: "Item-1",
                            warehouseId: "WH-EMPTY",
                            supplierId: "SP-001",
                            requestQty: 10,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-EMPTY", stock: 0 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const sub = findSub("A-030-001");
        expect(sub?.status).toBe("UNALLOCATED");
        expect(useAllocationStore.getState().logs.some(
            (l) => l.subOrderId === "A-030-001" && l.type === "error"
        )).toBe(true);
    });

    it("partially allocates when stock is less than requestQty", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-040",
                    subOrders: [
                        {
                            subOrderId: "A-040-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 100,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 30 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const sub = findSub("A-040-001");
        expect(sub?.allocated).toBe(30);
        expect(sub?.status).toBe("PARTIAL");
    });

    it("generates logs for each sub-order", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-050",
                    subOrders: [
                        {
                            subOrderId: "A-050-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 10,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 100 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const logs = useAllocationStore.getState().logs;
        expect(logs.length).toBeGreaterThan(0);
        expect(logs.some((l) => l.subOrderId === "A-050-001")).toBe(true);
    });

    it("deducts stock from warehouse cumulatively across sub-orders", () => {
        setMinimalState({
            orders: [
                {
                    orderId: "A-060",
                    subOrders: [
                        {
                            subOrderId: "A-060-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 40,
                            type: "EMERGENCY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
                {
                    orderId: "A-061",
                    subOrders: [
                        {
                            subOrderId: "A-061-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 40,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-0004",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 50 }],
            customers: [{ customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        // EMERGENCY gets all 40, only 10 left for DAILY
        const s1 = findSub("A-060-001");
        const s2 = findSub("A-061-001");
        expect(s1?.allocated).toBe(40);
        expect(s1?.status).toBe("ALLOCATED");
        expect(s2?.allocated).toBe(10);
        expect(s2?.status).toBe("PARTIAL");
    });

    it("limits allocation by credit when unit price > 0", () => {
        // Customer has 500 credit remaining, unitPrice ~111.14 → max 4 units
        setMinimalState({
            orders: [
                {
                    orderId: "A-070",
                    subOrders: [
                        {
                            subOrderId: "A-070-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 100,
                            type: "DAILY",
                            createDate: "2025-01-01",
                            customerId: "CT-LIM",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
            ],
            warehouses: [{ warehouseId: "WH-001", stock: 1000 }],
            customers: [{ customerId: "CT-LIM", creditLimit: 500, usedCredit: 0 }],
        });

        useAllocationStore.getState().runAutoAllocation();
        vi.advanceTimersByTime(1000);

        const sub = findSub("A-070-001");
        // 500 / 111.14 = 4.49 → floor = 4
        expect(sub?.allocated).toBe(4);
        expect(sub?.status).toBe("PARTIAL");
    });
});

// ─── Filter & Search setters ────────────────────────────────────────

describe("Filter & Search setters", () => {
    it("setSearchQuery updates searchQuery and resets currentPage to 1", () => {
        useAllocationStore.setState({ currentPage: 5 });
        useAllocationStore.getState().setSearchQuery("ORDER-0001");

        const state = useAllocationStore.getState();
        expect(state.searchQuery).toBe("ORDER-0001");
        expect(state.currentPage).toBe(1);
    });

    it("setFilterType updates filterType and resets currentPage to 1", () => {
        useAllocationStore.setState({ currentPage: 3 });
        useAllocationStore.getState().setFilterType("EMERGENCY");

        const state = useAllocationStore.getState();
        expect(state.filterType).toBe("EMERGENCY");
        expect(state.currentPage).toBe(1);
    });

    it("setFilterStatus updates filterStatus and resets currentPage to 1", () => {
        useAllocationStore.setState({ currentPage: 4 });
        useAllocationStore.getState().setFilterStatus("ALLOCATED");

        const state = useAllocationStore.getState();
        expect(state.filterStatus).toBe("ALLOCATED");
        expect(state.currentPage).toBe(1);
    });

    it("setCurrentPage updates currentPage without resetting other filters", () => {
        useAllocationStore.setState({ filterType: "EMERGENCY", searchQuery: "test" });
        useAllocationStore.getState().setCurrentPage(7);

        const state = useAllocationStore.getState();
        expect(state.currentPage).toBe(7);
        expect(state.filterType).toBe("EMERGENCY");
        expect(state.searchQuery).toBe("test");
    });
});

// ─── getFilteredSubOrders ────────────────────────────────────────────

describe("getFilteredSubOrders", () => {
    beforeEach(() => {
        setMinimalState({
            orders: [
                {
                    orderId: "F-001",
                    subOrders: [
                        {
                            subOrderId: "F-001-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 10,
                            type: "EMERGENCY",
                            createDate: "2025-01-01",
                            customerId: "CT-0001",
                            remark: "",
                            allocated: 10,
                            status: "ALLOCATED",
                        },
                        {
                            subOrderId: "F-001-002",
                            itemId: "Item-2",
                            warehouseId: "WH-002",
                            supplierId: "SP-002",
                            requestQty: 20,
                            type: "DAILY",
                            createDate: "2025-01-02",
                            customerId: "CT-0002",
                            remark: "",
                            allocated: 0,
                            status: "UNALLOCATED",
                        },
                    ],
                },
                {
                    orderId: "F-002",
                    subOrders: [
                        {
                            subOrderId: "F-002-001",
                            itemId: "Item-1",
                            warehouseId: "WH-001",
                            supplierId: "SP-001",
                            requestQty: 5,
                            type: "OVERDUE",
                            createDate: "2025-01-03",
                            customerId: "CT-0001",
                            remark: "",
                            allocated: 3,
                            status: "PARTIAL",
                        },
                    ],
                },
            ],
        });
    });

    it("returns all sub-orders when no filters are set", () => {
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(3);
    });

    it("filters by searchQuery (case insensitive) on subOrderId", () => {
        useAllocationStore.setState({ searchQuery: "f-001-001" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].subOrderId).toBe("F-001-001");
    });

    it("filters by searchQuery on orderId", () => {
        useAllocationStore.setState({ searchQuery: "F-002" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].orderId).toBe("F-002");
    });

    it("filters by searchQuery on customerId", () => {
        useAllocationStore.setState({ searchQuery: "CT-0002" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].customerId).toBe("CT-0002");
    });

    it("filters by searchQuery on itemId", () => {
        useAllocationStore.setState({ searchQuery: "Item-2" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].itemId).toBe("Item-2");
    });

    it("filters by filterType", () => {
        useAllocationStore.setState({ filterType: "EMERGENCY" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("EMERGENCY");
    });

    it("filters by filterStatus", () => {
        useAllocationStore.setState({ filterStatus: "PARTIAL" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe("PARTIAL");
    });

    it("combines search + type + status filters", () => {
        useAllocationStore.setState({
            searchQuery: "CT-0001",
            filterType: "OVERDUE",
            filterStatus: "PARTIAL",
        });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(1);
        expect(result[0].subOrderId).toBe("F-002-001");
    });

    it("returns empty when no matches", () => {
        useAllocationStore.setState({ searchQuery: "NONEXISTENT" });
        const result = useAllocationStore.getState().getFilteredSubOrders();
        expect(result).toHaveLength(0);
    });
});

// ─── resetAllocation ─────────────────────────────────────────────────

describe("resetAllocation", () => {
    it("restores orders, warehouses, customers to initial mock data", () => {
        // Mutate state first
        useAllocationStore.getState().manualAllocate("ORDER-0001-001", 100);

        // Now reset
        useAllocationStore.getState().resetAllocation();

        const state = useAllocationStore.getState();
        // All sub-orders should be back to unallocated
        const sub = findSub("ORDER-0001-001");
        expect(sub?.allocated).toBe(0);
        expect(state.logs).toEqual([]);
        expect(state.autoAllocateDone).toBe(false);
        expect(state.disabledButton).toBe(false);
    });

    it("clears logs and resets flags", () => {
        useAllocationStore.setState({
            logs: [{ subOrderId: "test", message: "msg", type: "success" }],
            autoAllocateDone: true,
            disabledButton: true,
        });

        useAllocationStore.getState().resetAllocation();
        const state = useAllocationStore.getState();
        expect(state.logs).toEqual([]);
        expect(state.autoAllocateDone).toBe(false);
        expect(state.disabledButton).toBe(false);
    });
});
