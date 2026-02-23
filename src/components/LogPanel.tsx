import { useAllocationStore } from "../store/allocationStore";
import { useState } from "react";

export function LogPanel() {
    const { logs } = useAllocationStore();
    const [open, setOpen] = useState(false);

    if (logs.length === 0) return null;

    const successCount = logs.filter((l) => l.type === "success").length;
    const warnCount = logs.filter((l) => l.type === "warning").length;
    const errCount = logs.filter((l) => l.type === "error").length;

    return (
        <div className="card shadow-md border-indigo-100 overflow-hidden">
            <button
                className="w-full px-6 py-4 flex items-center justify-between bg-linear-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 transition-colors cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-4">
                    <span className="text-xl">📋</span>
                    <span className="font-semibold text-indigo-900 text-lg">ผลการจัดสรรอัตโนมัติล่าสุด</span>
                    <div className="flex items-center gap-3 ml-4">
                        {successCount > 0 && <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">{successCount} สำเร็จ</span>}
                        {warnCount > 0 && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">{warnCount} บางส่วน</span>}
                        {errCount > 0 && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">{errCount} ล้มเหลว</span>}
                    </div>
                </div>
                <div className={`p-2 rounded-full bg-white shadow-sm border border-indigo-50 hover:bg-indigo-50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            {open && (
                <div className="border-t border-indigo-100 bg-slate-50 max-h-96 overflow-y-auto p-5 shadow-inner">
                    <div className="flex flex-col gap-3">
                        {logs.map((log, i) => {
                            const isSuccess = log.type === "success";
                            const isWarn = log.type === "warning";
                            return (
                                <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${isSuccess ? "border-green-200" : isWarn ? "border-amber-200" : "border-red-200"}`}>
                                    <div className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ring-4 shadow-sm ${isSuccess ? "bg-green-500 ring-green-100" : isWarn ? "bg-amber-500 ring-amber-100" : "bg-red-500 ring-red-100"}`} />
                                    <span className="font-mono text-sm font-bold text-slate-700 mt-0.5 w-28 shrink-0">{log.subOrderId}</span>
                                    <span className={`text-base font-medium ${isSuccess ? "text-green-800" : isWarn ? "text-amber-800" : "text-red-800"}`}>{log.message}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}