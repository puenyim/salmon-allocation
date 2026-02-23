import { useState } from "react";
import { useAllocationStore, type SubOrder } from "../store/allocationStore";

interface Props {
    sub: SubOrder & { orderId: string };
    onClose: () => void;
}

export function ManualAllocateModal({ sub, onClose }: Props) {
    const { manualAllocate, warehouses, customers } = useAllocationStore();
    const [qty, setQty] = useState<string>(String(sub.allocated));
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resolvedWH = sub.resolvedWarehouseId || sub.warehouseId;
    const wh = warehouses.find((w) => w.warehouseId === resolvedWH);
    const customer = customers.find((c) => c.customerId === sub.customerId);
    const creditRemaining = customer ? customer.creditLimit - customer.usedCredit + (sub.totalValue ?? 0) : 0;

    const handleSubmit = () => {
        const val = parseInt(qty, 10);
        if (isNaN(val) || val < 0) {
            setError("กรุณากรอกตัวเลขที่ถูกต้อง");
            return;
        }
        const err = manualAllocate(sub.subOrderId, val);
        if (err) {
            setError(err);
        } else {
            setSuccess(true);
            setTimeout(onClose, 800);
        }
    };

    const typeColor: Record<string, string> = {
        EMERGENCY: "#ef4444",
        OVERDUE: "#f59e0b",
        DAILY: "#22c55e",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Manual Allocation</h3>
                        <p className="text-sm text-slate-500 font-mono mt-0.5">{sub.subOrderId}</p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" onClick={onClose}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Item</span>
                            <span className="font-semibold text-slate-800">{sub.itemId}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ประเภท</span>
                            <span className="font-bold text-sm px-2 py-0.5 rounded w-max" style={{ background: typeColor[sub.type] + "15", color: typeColor[sub.type], border: `1px solid ${typeColor[sub.type]}30` }}>
                                {sub.type}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Warehouse</span>
                            <span className="font-semibold text-slate-800">{resolvedWH}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock คงเหลือ</span>
                            <span className={`font-semibold ${((wh?.stock ?? 0) < 100) ? "text-red-500" : "text-green-600"}`}>
                                {(wh?.stock ?? 0).toLocaleString()} หน่วย
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ลูกค้า</span>
                            <span className="font-semibold text-slate-800">{sub.customerId}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Credit คงเหลือ</span>
                            <span className={`font-mono font-semibold ${creditRemaining < 10000 ? "text-red-500" : "text-amber-600"}`}>
                                ฿{creditRemaining.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ราคาต่อหน่วย</span>
                            <span className="font-mono font-semibold text-slate-700">฿{(sub.unitPrice ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Request Qty</span>
                            <span className="font-mono font-semibold text-slate-700">{sub.requestQty} หน่วย</span>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-blue-900 mb-2">จำนวนที่ต้องการจัดสรร</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 max-w-sm w-full">
                                <input
                                    className={`input-field w-full font-mono font-bold text-lg text-slate-800 pr-16 bg-white ${error ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "focus:border-blue-500 focus:ring-blue-500"}`}
                                    type="number"
                                    min={0}
                                    max={sub.requestQty}
                                    value={qty}
                                    onChange={(e) => { setQty(e.target.value); setError(null); }}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-medium bg-linear-gradient-to-l from-white via-white to-transparent pl-4 rounded-r-lg">หน่วย</div>
                            </div>
                            <button
                                className="px-5 py-2 min-h-[44px] bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200 flex items-center justify-center shrink-0"
                                onClick={() => { setQty(String(sub.requestQty)); setError(null); }}
                            >
                                Max
                            </button>
                        </div>

                        {qty && !isNaN(parseInt(qty)) && sub.unitPrice && (
                            <div className="mt-4 flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-600 bg-white inline-flex items-center px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    มูลค่าประมาณ:&nbsp;<span className="font-mono font-bold text-slate-800 text-base">฿{(parseInt(qty) * sub.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                </p>
                            </div>
                        )}

                        {error && <p className="mt-3 text-sm font-bold text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {error}</p>}
                        {success && <p className="mt-3 text-sm font-bold text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-2 rounded-lg border border-green-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> จัดสรรสำเร็จ</p>}
                    </div>
                </div>

                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex items-center justify-end gap-3">
                    <button className="btn btn-ghost" onClick={onClose} disabled={success}>ยกเลิก</button>
                    <button
                        className={`btn min-w-[160px] font-bold shadow-md ${success ? "bg-green-600 text-white hover:bg-green-700 shadow-green-500/20" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"}`}
                        onClick={handleSubmit}
                        disabled={success}
                    >
                        {success ? (
                            <span className="flex items-center gap-2 z-10">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                สำเร็จ!
                            </span>
                        ) : "ยืนยันการจัดสรร"}
                    </button>
                </div>
            </div>
        </div>
    );
}