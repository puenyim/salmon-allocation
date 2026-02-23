import { useState } from "react";
import { useAllocationStore, type SubOrder } from "../store/allocationStore";
import { ManualAllocateModal } from "./ManualAllocateModal";

const TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
    EMERGENCY: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
    OVERDUE: { bg: "#fef9c3", text: "#b45309", border: "#fde68a" },
    DAILY: { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
};

const STATUS_CONFIG: Record<
    string,
    { label: string; bg: string; text: string }
> = {
    UNALLOCATED: { label: "ยังไม่จัดสรร", bg: "#f3f4f6", text: "#6b7280" },
    PARTIAL: { label: "บางส่วน", bg: "#fff7ed", text: "#c2410c" },
    ALLOCATED: { label: "จัดสรรแล้ว", bg: "#f0fdf4", text: "#15803d" },
    CREDIT_EXCEEDED: { label: "เกิน Credit", bg: "#fdf2f8", text: "#9d174d" },
};

export function OrderTable() {
    const { getFilteredSubOrders, currentPage, pageSize, setCurrentPage } =
        useAllocationStore();
    const [modalSub, setModalSub] = useState<
        (SubOrder & { orderId: string }) | null
    >(null);

    const all = getFilteredSubOrders();
    const totalPages = Math.ceil(all.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const pageData = all.slice(start, start + pageSize);

    const renderPagination = () => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            )
                pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    if (all.length === 0) {
        return (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4 opacity-50 drop-shadow-sm">🔍</div>
                <p className="text-lg text-slate-500 font-medium">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
        );
    }

    return (
        <div className="card flex flex-col bg-white">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1300px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
                            <th className="py-4 px-5 font-semibold">Order ID</th>
                            <th className="py-4 px-5 font-semibold">Sub Order ID</th>
                            <th className="py-4 px-5 font-semibold">Item</th>
                            <th className="py-4 px-5 font-semibold">ประเภท</th>
                            <th className="py-4 px-5 font-semibold">Warehouse</th>
                            <th className="py-4 px-5 font-semibold">Supplier</th>
                            <th className="py-4 px-5 font-semibold">วันที่สร้าง</th>
                            <th className="py-4 px-5 font-semibold">ลูกค้า</th>
                            <th className="py-4 px-5 font-semibold text-right">Request</th>
                            <th className="py-4 px-5 font-semibold text-right">จัดสรร</th>
                            <th className="py-4 px-5 font-semibold text-right">ราคา/หน่วย</th>
                            <th className="py-4 px-5 font-semibold text-right">มูลค่ารวม</th>
                            <th className="py-4 px-5 font-semibold">สถานะ</th>
                            <th className="py-4 px-5 font-semibold text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {pageData.map((sub) => {
                            const typeStyle = TYPE_COLOR[sub.type] ?? TYPE_COLOR.DAILY;
                            const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.UNALLOCATED;
                            const pct = sub.requestQty > 0 ? (sub.allocated / sub.requestQty) * 100 : 0;
                            const isError = sub.status === "CREDIT_EXCEEDED" || (sub.status === "UNALLOCATED" && sub.allocated === 0);

                            return (
                                <tr key={sub.subOrderId} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="py-3 px-5 text-sm font-mono text-slate-700">{sub.orderId}</td>
                                    <td className="py-3 px-5 text-sm font-mono font-bold text-slate-400">{sub.subOrderId}</td>
                                    <td className="py-3 px-5 text-sm font-semibold text-slate-800">{sub.itemId}</td>
                                    <td className="py-3 px-5 text-sm">
                                        <span
                                            className="px-2.5 py-1 rounded-md text-xs font-bold inline-block shadow-sm"
                                            style={{
                                                background: typeStyle.bg,
                                                color: typeStyle.text,
                                                border: `1px solid ${typeStyle.border}`,
                                            }}
                                        >
                                            {sub.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-slate-700">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            {sub.resolvedWarehouseId || sub.warehouseId}
                                            {sub.warehouseId === "WH-000" && sub.resolvedWarehouseId && (
                                                <span className="bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider shadow-sm">ANY</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-slate-700">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            {sub.resolvedSupplierId || sub.supplierId}
                                            {sub.supplierId === "SP-000" && sub.resolvedSupplierId && (
                                                <span className="bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider shadow-sm">ANY</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-slate-500 whitespace-nowrap">{sub.createDate}</td>
                                    <td className="py-3 px-5 text-sm">
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 shadow-sm">{sub.customerId}</span>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-right font-mono font-medium">{sub.requestQty.toLocaleString()}</td>
                                    <td className="py-3 px-5 text-sm text-right">
                                        <div className="flex flex-col items-end gap-1.5 w-full min-w-[90px]">
                                            <span className={`font-mono font-bold ${pct === 100 ? "text-green-600" : pct > 0 ? "text-amber-600" : isError ? "text-red-500" : "text-slate-500"}`}>
                                                {sub.allocated.toLocaleString()}
                                            </span>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-linear-to-r from-emerald-400 to-green-500" : "bg-linear-to-r from-amber-400 to-orange-400"}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-right font-mono text-slate-500">
                                        {sub.unitPrice ? `฿${sub.unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                                    </td>
                                    <td className="py-3 px-5 text-sm text-right font-mono font-bold text-slate-800">
                                        {sub.totalValue ? `฿${sub.totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                                    </td>
                                    <td className="py-3 px-5 text-sm">
                                        <span
                                            className="px-2.5 py-1 rounded-full text-xs font-bold inline-block shadow-sm whitespace-nowrap"
                                            style={{ background: statusCfg.bg, color: statusCfg.text }}
                                        >
                                            {statusCfg.label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-center">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-colors border border-transparent hover:border-blue-200 group-hover:opacity-100 opacity-60 ml-auto flex items-center justify-center gap-1 shadow-sm"
                                            onClick={() => setModalSub(sub)}
                                            title="แก้ไขการจัดสรร"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            แก้ไข
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 rounded-b-xl">
                <span className="text-sm text-slate-500 font-medium">
                    แสดง <span className="text-slate-700 font-bold">{start + 1}</span>–<span className="text-slate-700 font-bold">{Math.min(start + pageSize, all.length)}</span> จาก <span className="text-slate-700 font-bold">{all.length}</span> รายการ
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium border border-transparent hover:border-slate-300"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        ‹
                    </button>
                    {renderPagination().map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === p ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-600" : "text-slate-600 hover:bg-slate-200 border border-transparent hover:border-slate-300"}`}
                                onClick={() => setCurrentPage(p as number)}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium border border-transparent hover:border-slate-300"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        ›
                    </button>
                </div>
            </div>

            {modalSub && (
                <ManualAllocateModal sub={modalSub} onClose={() => setModalSub(null)} />
            )}
        </div>
    );
}