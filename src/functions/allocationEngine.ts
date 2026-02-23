// engine/allocationEngine.ts
import Decimal from "decimal.js"
import type { Order } from "../types"
import { bankerRound } from "./bankerRound"

interface Params {
    orders: Order[]
    stock: Record<string, number>
    credit: Record<string, number>
    priceMap: Record<string, number>
    multiplier: Record<string, number>
}

export function autoAllocate({
    orders,
    stock,
    credit,
    priceMap,
    multiplier
}: Params) {
    const priority = { EMERGENCY: 1, OVERDUE: 2, DAILY: 3 }

    const sorted = [...orders].sort((a, b) => {
        if (priority[a.type] !== priority[b.type]) {
            return priority[a.type] - priority[b.type]
        }
        return new Date(a.createDate).getTime() -
            new Date(b.createDate).getTime()
    })

    const allocations: Record<string, number> = {}

    for (const order of sorted) {
        const stockKey = `${order.itemId}-${order.warehouseId}`
        const priceKey = `${order.itemId}-${order.supplierId}`

        const availableStock = stock[stockKey] || 0
        const availableCredit = credit[order.customerId] || 0

        const basePrice = priceMap[priceKey] || 0
        const finalPrice = new Decimal(basePrice)
            .mul(multiplier[order.type])
            .toNumber()

        const maxByCredit = new Decimal(availableCredit)
            .div(finalPrice)
            .toNumber()

        const allocatable = Math.min(
            order.requestQty,
            availableStock,
            maxByCredit
        )

        const finalQty = bankerRound(allocatable)

        allocations[order.subOrder] = finalQty

        // update stock & credit
        stock[stockKey] -= finalQty
        credit[order.customerId] -= finalQty * finalPrice
    }

    return allocations
}