import { useTranslation } from "react-i18next";
import { useAllocationStore } from "../store/allocationStore";

export function SummaryBar() {
    const { orders, warehouses, customers } = useAllocationStore();
    const { t } = useTranslation();

    const allSubs = orders.flatMap((o) => o.subOrders);
    const total = allSubs.length;
    const allocated = allSubs.filter((s) => s.status === "ALLOCATED").length;
    const partial = allSubs.filter((s) => s.status === "PARTIAL").length;
    const unallocated = allSubs.filter((s) => s.status === "UNALLOCATED").length;
    const exceeded = allSubs.filter((s) => s.status === "CREDIT_EXCEEDED").length;

    const totalStock = warehouses
        .filter((w) => w.warehouseId !== "WH-000")
        .reduce((sum, w) => sum + w.stock, 0);

    return (
        <div className="flex flex-col xl:flex-row gap-4 w-full">
            {/* Main Stats */}
            <div className="card flex-1 p-4 flex gap-4 overflow-x-auto min-w-0">
                <div className="flex flex-col items-center justify-center p-3 px-6 bg-slate-50 rounded-xl border border-slate-100 min-w-fit flex-1">
                    <span className="text-sm font-semibold text-slate-500 mb-1">{t("total")}</span>
                    <span className="text-3xl font-bold text-slate-800">{total}</span>
                </div>
                <div className="w-px bg-slate-200 shrink-0 my-2" />
                <div className="flex flex-col items-center justify-center p-3 px-6 bg-green-50 rounded-xl border border-green-100 w-full min-w-[120px] flex-1">
                    <span className="text-sm font-semibold text-green-600 mb-1">{t("allocated")}</span>
                    <span className="text-3xl font-bold text-green-700">{allocated}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 px-6 bg-amber-50 rounded-xl border border-amber-100 w-full min-w-[120px] flex-1">
                    <span className="text-sm font-semibold text-amber-600 mb-1">{t("partial")}</span>
                    <span className="text-3xl font-bold text-amber-700">{partial}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 px-6 bg-gray-50 rounded-xl border border-gray-200 w-full min-w-[120px] flex-1">
                    <span className="text-sm font-semibold text-gray-500 mb-1">{t("unallocated")}</span>
                    <span className="text-3xl font-bold text-gray-700">{unallocated}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 px-6 bg-rose-50 rounded-xl border border-rose-100 w-full min-w-[120px] flex-1">
                    <span className="text-sm font-semibold text-rose-600 mb-1">{t("exceeded")}</span>
                    <span className="text-3xl font-bold text-rose-700">{exceeded}</span>
                </div>
            </div>

            {/* Sub Stats Wrapper */}
            <div className="flex flex-col gap-4 xl:w-2/5 shrink-0 overflow-x-auto">
                {/* Warehouses */}

                <div className="card p-4 flex flex-col gap-6 overflow-x-auto min-w-fit flex-1 bg-linear-to-br from-indigo-50 to-white">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Warehouse Stock {totalStock.toLocaleString()}</label>
                    <div className="flex flex-row gap-6">
                        {warehouses.filter((w) => w.warehouseId !== "WH-000").map((w) => (
                            <div className="flex flex-col  drop-shadow-sm" key={w.warehouseId}>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">{w.warehouseId}</span>
                                <span className={`text-xl font-bold px-3 py-1 bg-white rounded-lg shadow-sm border border-indigo-50 ${w.stock < 2000 ? "text-red-500" : "text-indigo-900"}`}>
                                    {w.stock.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Customers */}
                <div className="card p-5 flex flex-col gap-4 overflow-x-auto min-w-fit flex-1 bg-slate-50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Credit Usage</div>
                    <div className="flex gap-6 pb-2">
                        {customers.map((c) => {
                            const pct = Math.round((c.usedCredit / c.creditLimit) * 100);
                            const isDanger = pct > 90;
                            const isWarn = pct > 70 && !isDanger;
                            return (
                                <div className="flex flex-col min-w-[120px]" key={c.customerId}>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-sm font-bold text-slate-700">{c.customerId}</span>
                                        <span className={`text-xs font-bold px-1.5 rounded bg-white shadow-sm border ${isDanger ? "text-red-600 border-red-100" : isWarn ? "text-amber-600 border-amber-100" : "text-green-600 border-green-100"}`}>{pct}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isDanger ? "bg-linear-to-r from-red-500 to-rose-500" : isWarn ? "bg-linear-to-r from-amber-400 to-orange-400" : "bg-linear-to-r from-emerald-400 to-green-500"}`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}