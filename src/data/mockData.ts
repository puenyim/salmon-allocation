interface Warehouse {
    warehouseId: string;
    stock: number;
    note?: string;
}
interface Supplier {
    supplierId: string;
    stock: number;
    note?: string;
}
interface Price {
    itemId: string;
    supplierId: string;
    basePrice: number;
    tiers: {
        priceTier: string;
        percentage: number;
    }[];
}
interface Customer {
    customerId: string;
    creditLimit: number;
    usedCredit: number;
}
interface SubOrder {
    subOrderId: string;
    itemId: string;
    warehouseId: string;
    supplierId: string;
    requestQty: number;
    type: string;
    createDate: string;
    customerId: string;
    remark: string;
    allocated: number;
    status: string;
}
interface Order {
    orderId: string;
    subOrders: SubOrder[];
}

export const mockData: {
    warehouses: Warehouse[];
    suppliers: Supplier[];
    prices: Price[];
    customers: Customer[];
    orders: Order[];
} = {
    /**
     * Warehouses
     * - WH-001: stock ปกติ
     * - WH-002: stock สูงสุด (ให้ WH-000 เลือกก่อน)
     * - WH-003: stock เกือบหมด → ทดสอบ AC-002 (warning สีแดง < 10%)
     * - WH-000: Any warehouse → ระบบต้องเลือก WH-002 ก่อน (stock สูงสุด)
     */
    warehouses: [
        { warehouseId: "WH-001", stock: 20000 },
        { warehouseId: "WH-002", stock: 30000 },
        { warehouseId: "WH-003", stock: 500 },   // เกือบหมด → แดง AC-002
        { warehouseId: "WH-000", stock: 0, note: "Any warehouse" }
    ],

    /**
     * Suppliers
     * - SP-001: stock ปกติ
     * - SP-002: stock สูงกว่า → ทดสอบ SP-000 เลือก SP-002 ก่อน
     * - SP-000: Any supplier → ระบบต้องเลือก SP-002 ก่อน (stock สูงสุด)
     */
    suppliers: [
        { supplierId: "SP-001", stock: 25000 },
        { supplierId: "SP-002", stock: 40000 },  // สูงสุด → SP-000 ต้องเลือกนี้ก่อน AC-011
        { supplierId: "SP-000", stock: 0, note: "Any supplier" }
    ],

    /**
     * Prices
     * ครอบคลุม: Item-1/Item-2 × SP-001/SP-002/SP-000 × ทุก Tier
     * ทดสอบ Banker's Rounding AC-010:
     *   Item-2/SP-001 basePrice=88.885 → DAILY 90% = 79.9965 → round = 80.00
     *   Item-2/SP-001 basePrice=88.885 → EMERGENCY 120% = 106.662 → round = 106.66
     */
    prices: [
        {
            itemId: "Item-1", supplierId: "SP-001", basePrice: 123.49,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },  // 148.188 → 148.19
                { priceTier: "OVER_DUE", percentage: 100 },  // 123.49
                { priceTier: "DAILY", percentage: 90 }   // 111.141 → 111.14
            ]
        },
        {
            itemId: "Item-1", supplierId: "SP-002", basePrice: 115.00,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },  // 138.00
                { priceTier: "OVER_DUE", percentage: 100 },  // 115.00
                { priceTier: "DAILY", percentage: 90 }   // 103.50
            ]
        },
        {
            itemId: "Item-1", supplierId: "SP-000", basePrice: 98.75,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },
                { priceTier: "OVER_DUE", percentage: 100 },
                { priceTier: "DAILY", percentage: 90 }
            ]
        },
        {
            // Banker's Rounding test case → AC-010
            itemId: "Item-2", supplierId: "SP-001", basePrice: 88.885,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },  // 106.662 → 106.66
                { priceTier: "OVER_DUE", percentage: 100 },  // 88.885  → 88.88 (half to even)
                { priceTier: "DAILY", percentage: 90 }   // 79.9965 → 80.00
            ]
        },
        {
            itemId: "Item-2", supplierId: "SP-002", basePrice: 75.50,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },
                { priceTier: "OVER_DUE", percentage: 100 },
                { priceTier: "DAILY", percentage: 90 }
            ]
        },
        {
            itemId: "Item-2", supplierId: "SP-000", basePrice: 70.00,
            tiers: [
                { priceTier: "EMERGENCY", percentage: 120 },
                { priceTier: "OVER_DUE", percentage: 100 },
                { priceTier: "DAILY", percentage: 90 }
            ]
        }
    ],

    /**
     * Customers — ครอบคลุม edge case credit:
     * CT-0001: credit เหลือน้อย (200000-195000=5000) → จัดสรรได้จำกัด AC-005/AC-012
     * CT-0002: credit ปกติ (150000-50000=100000)
     * CT-0003: credit เหลือ 0 → ทุก order ต้อง status "Credit Exceeded" AC-012
     * CT-0004: credit เต็ม ยังไม่ใช้เลย
     */
    customers: [
        { customerId: "CT-0001", creditLimit: 200000, usedCredit: 195000 }, // เกือบเต็ม
        { customerId: "CT-0002", creditLimit: 150000, usedCredit: 50000 }, // ปกติ
        { customerId: "CT-0003", creditLimit: 80000, usedCredit: 80000 }, // เต็มแล้ว → Credit Exceeded
        { customerId: "CT-0004", creditLimit: 999999, usedCredit: 0 }  // VIP ไม่ติดปัญหา credit
    ],

    orders: []
};

// ─── Pinned Orders: ครอบคลุม edge case แต่ละ AC ───────────────────────────

const pinnedOrders: Order[] = [

    // [AC-008] EMERGENCY + เก่าสุด → ต้องได้รับการจัดสรรก่อนทุก order
    {
        orderId: "ORDER-0001",
        subOrders: [{
            subOrderId: "ORDER-0001-001", itemId: "Item-1",
            warehouseId: "WH-001", supplierId: "SP-001",
            requestQty: 300, type: "EMERGENCY",
            createDate: "2025-01-01",           // เก่าสุด
            customerId: "CT-0002", remark: "FIFO Emergency ต้องมาก่อน",
            allocated: 0, status: ""
        }]
    },

    // [AC-008] EMERGENCY + ใหม่กว่า ORDER-0001 → มาหลัง ORDER-0001
    {
        orderId: "ORDER-0002",
        subOrders: [{
            subOrderId: "ORDER-0002-001", itemId: "Item-1",
            warehouseId: "WH-001", supplierId: "SP-001",
            requestQty: 200, type: "EMERGENCY",
            createDate: "2025-03-01",
            customerId: "CT-0004", remark: "Emergency แต่ใหม่กว่า ORDER-0001",
            allocated: 0, status: ""
        }]
    },

    // [AC-008] OVERDUE → มาหลัง EMERGENCY ทั้งหมด
    {
        orderId: "ORDER-0003",
        subOrders: [{
            subOrderId: "ORDER-0003-001", itemId: "Item-1",
            warehouseId: "WH-001", supplierId: "SP-001",
            requestQty: 150, type: "OVERDUE",
            createDate: "2025-01-15",
            customerId: "CT-0002", remark: "Overdue ต้องมาหลัง Emergency",
            allocated: 0, status: ""
        }]
    },

    // [AC-011] WH-000 + SP-000 → ระบบเลือก WH-002 (30000) และ SP-002 (40000) ก่อน
    {
        orderId: "ORDER-0004",
        subOrders: [{
            subOrderId: "ORDER-0004-001", itemId: "Item-1",
            warehouseId: "WH-000", supplierId: "SP-000",
            requestQty: 100, type: "DAILY",
            createDate: "2025-02-01",
            customerId: "CT-0004", remark: "Any WH + Any SP → เลือก stock สูงสุด",
            allocated: 0, status: ""
        }]
    },

    // [AC-011] WH-000 เท่านั้น Supplier ระบุชัด
    {
        orderId: "ORDER-0005",
        subOrders: [{
            subOrderId: "ORDER-0005-001", itemId: "Item-2",
            warehouseId: "WH-000", supplierId: "SP-001",
            requestQty: 50, type: "DAILY",
            createDate: "2025-02-10",
            customerId: "CT-0002", remark: "Any WH → เลือก WH stock สูงสุด",
            allocated: 0, status: ""
        }]
    },

    // [AC-005/AC-012] CT-0001 credit เหลือแค่ 5,000 → จัดสรรได้บางส่วนเท่านั้น
    // Item-1/SP-001/DAILY: 123.49 × 90% = 111.141 → 111.14/unit
    // 5000 / 111.14 ≈ 44.99 units → ได้แค่ ~44 units จาก 500 ที่ขอ
    {
        orderId: "ORDER-0006",
        subOrders: [{
            subOrderId: "ORDER-0006-001", itemId: "Item-1",
            warehouseId: "WH-001", supplierId: "SP-001",
            requestQty: 500, type: "DAILY",
            createDate: "2025-02-15",
            customerId: "CT-0001", remark: "Credit เกือบเต็ม → Partial allocation",
            allocated: 0, status: ""
        }]
    },

    // [AC-012] CT-0003 credit เต็ม 100% → ทุก subOrder ต้อง status = "Credit Exceeded"
    {
        orderId: "ORDER-0007",
        subOrders: [
            {
                subOrderId: "ORDER-0007-001", itemId: "Item-1",
                warehouseId: "WH-001", supplierId: "SP-001",
                requestQty: 100, type: "EMERGENCY",
                createDate: "2025-01-20",
                customerId: "CT-0003", remark: "Credit เต็ม → Credit Exceeded ทันที",
                allocated: 0, status: ""
            },
            {
                subOrderId: "ORDER-0007-002", itemId: "Item-2",
                warehouseId: "WH-002", supplierId: "SP-002",
                requestQty: 50, type: "DAILY",
                createDate: "2025-01-20",
                customerId: "CT-0003", remark: "Credit เต็ม → Credit Exceeded ทันที",
                allocated: 0, status: ""
            }
        ]
    },

    // [AC-004] Stock ใน WH-003 เกือบหมด (500) แต่ order ขอ 490 → จัดสรรได้พอดี
    {
        orderId: "ORDER-0008",
        subOrders: [{
            subOrderId: "ORDER-0008-001", itemId: "Item-2",
            warehouseId: "WH-003", supplierId: "SP-001",
            requestQty: 490, type: "DAILY",
            createDate: "2025-03-01",
            customerId: "CT-0004", remark: "WH-003 stock เกือบหมด จัดสรรได้พอดี",
            allocated: 0, status: ""
        }]
    },

    // [AC-004] Stock ใน WH-003 → order ขอเกิน stock ที่เหลือ (หลัง ORDER-0008 ดึงไปแล้ว)
    {
        orderId: "ORDER-0009",
        subOrders: [{
            subOrderId: "ORDER-0009-001", itemId: "Item-2",
            warehouseId: "WH-003", supplierId: "SP-001",
            requestQty: 100, type: "DAILY",
            createDate: "2025-03-05",
            customerId: "CT-0004", remark: "Stock ใน WH-003 หมดแล้ว → จัดสรรไม่ได้",
            allocated: 0, status: ""
        }]
    },

    // [AC-010] Banker's Rounding → 88.885 × 100% = 88.885 → round = 88.88 (half to even)
    {
        orderId: "ORDER-0010",
        subOrders: [{
            subOrderId: "ORDER-0010-001", itemId: "Item-2",
            warehouseId: "WH-002", supplierId: "SP-001",
            requestQty: 10, type: "OVERDUE",
            createDate: "2025-04-01",
            customerId: "CT-0004", remark: "Banker's Rounding: 88.885 → 88.88",
            allocated: 0, status: ""
        }]
    },

    // [AC-009] ทดสอบครบทุก Price Tier ใน 1 order (Multiple subOrders ต่างประเภท)
    {
        orderId: "ORDER-0011",
        subOrders: [
            {
                subOrderId: "ORDER-0011-001", itemId: "Item-1",
                warehouseId: "WH-002", supplierId: "SP-001",
                requestQty: 20, type: "EMERGENCY",
                createDate: "2025-04-10",
                customerId: "CT-0004", remark: "Price Tier EMERGENCY 120%",
                allocated: 0, status: ""
            },
            {
                subOrderId: "ORDER-0011-002", itemId: "Item-1",
                warehouseId: "WH-002", supplierId: "SP-001",
                requestQty: 20, type: "OVERDUE",
                createDate: "2025-04-10",
                customerId: "CT-0004", remark: "Price Tier OVERDUE 100%",
                allocated: 0, status: ""
            },
            {
                subOrderId: "ORDER-0011-003", itemId: "Item-1",
                warehouseId: "WH-002", supplierId: "SP-001",
                requestQty: 20, type: "DAILY",
                createDate: "2025-04-10",
                customerId: "CT-0004", remark: "Price Tier DAILY 90%",
                allocated: 0, status: ""
            }
        ]
    },

    // [AC-014] Bulk Action — order กลุ่มใหญ่ 5 subOrders ใน order เดียว
    {
        orderId: "ORDER-0012",
        subOrders: Array.from({ length: 5 }, (_, j) => ({
            subOrderId: `ORDER-0012-00${j + 1}`,
            itemId: j % 2 === 0 ? "Item-1" : "Item-2",
            warehouseId: ["WH-001", "WH-002", "WH-000", "WH-001", "WH-002"][j],
            supplierId: ["SP-001", "SP-002", "SP-000", "SP-001", "SP-002"][j],
            requestQty: 30 + j * 10,
            type: ["EMERGENCY", "OVERDUE", "DAILY", "DAILY", "OVERDUE"][j],
            createDate: "2025-05-01",
            customerId: "CT-0004",
            remark: `Bulk action test subOrder ${j + 1}`,
            allocated: 0, status: ""
        }))
    }
];

// ─── Random Orders: เติมจนครบ 100 orders (index 13–100) ────────────────────

const randomOrders: Order[] = Array.from({ length: 81 }, (_, i) => {
    const index = i + 13;
    const startDate = new Date("2025-01-01").getTime();
    const endDate = new Date("2026-01-01").getTime();

    const types = ["EMERGENCY", "OVERDUE", "DAILY"];
    const warehouses = ["WH-000", "WH-001", "WH-002"];
    const suppliers = ["SP-000", "SP-001", "SP-002"];
    const customers = ["CT-0001", "CT-0002", "CT-0003", "CT-0004"];
    const items = ["Item-1", "Item-2"];

    const randomDate = new Date(startDate + Math.random() * (endDate - startDate))
        .toISOString().split("T")[0];

    return {
        orderId: `ORDER-${String(index).padStart(4, "0")}`,
        subOrders: [{
            subOrderId: `ORDER-${String(index).padStart(4, "0")}-001`,
            itemId: items[i % 2],
            warehouseId: warehouses[i % 3],
            supplierId: suppliers[i % 3],
            requestQty: Math.max(1, Math.floor(Math.random() * 500)),
            type: types[Math.floor(Math.random() * types.length)],
            createDate: randomDate,
            customerId: customers[i % 4],
            remark: "",
            allocated: 0,
            status: ""
        }]
    };
});

mockData.orders = [...pinnedOrders, ...randomOrders];