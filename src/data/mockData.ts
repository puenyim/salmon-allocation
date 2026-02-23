export const mockData: {
    warehouses: any[];
    suppliers: any[];
    customers: any[];
    orders: any[];
} = {
    warehouses: [
        { warehouseId: "WH-001", stock: 500 },
        { warehouseId: "WH-002", stock: 300 },
        { warehouseId: "WH-000", stock: null, note: "Any warehouse" }
    ],
    suppliers: [
        { supplierId: "SP-001", stock: 400 },
        { supplierId: "SP-000", stock: null, note: "Any supplier" }
    ],
    customers: [
        { customerId: "CT-0001", creditLimit: 50000, usedCredit: 0 },
        { customerId: "CT-0002", creditLimit: 80000, usedCredit: 0 }
    ],
    orders: []   // ✅ ตอนนี้เป็น Order[]
};

mockData.orders = Array.from({ length: 2000 }, (_, i) => {
    const index = i + 1;
    const startDate = new Date("2025-01-01").getTime();
    const endDate = new Date("2026-01-01").getTime();

    const orderTypes = ["EMERGENCY", "OVERDUE", "DAILY"];
    const randomType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    const randomTime =
        startDate + Math.random() * (endDate - startDate);

    const randomDate = new Date(randomTime)
        .toISOString()
        .split("T")[0];

    return {
        orderId: `ORDER-${String(index).padStart(4, "0")}`,
        subOrders: [
            {
                subOrderId: `ORDER-${String(index).padStart(4, "0")}-001`,
                itemId: "Item-1",
                warehouseId: index % 2 === 0 ? "WH-001" : "WH-002",
                supplierId: "SP-001",
                requestQty: Math.floor(Math.random() * 500),
                type: randomType,
                createDate: randomDate,
                customerId: index % 2 === 0 ? "CT-0001" : "CT-0002",
                remark: "",
                allocated: 0,
                status: "UNALLOCATED"
            }
        ]
    };
});