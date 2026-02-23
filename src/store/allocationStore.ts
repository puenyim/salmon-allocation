// // store/allocationStore.ts
// import { create } from "zustand"
// import { autoAllocate } from "../functions/allocationEngine"
// import { orders, stock, credit, priceMap, multiplier } from "../data/mockData"

// interface AllocationState {
//     allocations: Record<string, number>
//     runAuto: () => void
//     manualAllocate: (subOrderId: string, qty: number) => void
// }

// export const useAllocationStore = create<AllocationState>((set, get) => ({
//     allocations: {},

//     runAuto: () => {
//         const result = autoAllocate({
//             orders: [...orders],
//             stock: { ...stock },
//             credit: { ...credit },
//             priceMap,
//             multiplier
//         })
//         set({ allocations: result })
//     },

//     manualAllocate: (subOrderId, qty) => {
//         set((state) => ({
//             allocations: {
//                 ...state.allocations,
//                 [subOrderId]: qty
//             }
//         }))
//     }
// }))