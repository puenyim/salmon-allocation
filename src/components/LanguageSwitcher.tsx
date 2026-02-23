import { useState } from "react";
import { useLanguageStore } from "../store/useLanguageStore";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguageStore();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(!open)}
                className="bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2.5 hover:bg-white hover:shadow transition-all font-semibold text-slate-700 outline-none hover:border-slate-300"
            >
                {language === "th" ? (
                    <>
                        <span className="fi fi-th rounded-sm overflow-hidden text-lg" />
                        <span className="tracking-wide">TH</span>
                    </>
                ) : (
                    <>
                        <span className="fi fi-gb rounded-sm overflow-hidden text-lg" />
                        <span className="tracking-wide">EN</span>
                    </>
                )}
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-36 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden transform duration-200">
                    <button
                        onClick={() => { setLanguage("th"); setOpen(false) }}
                        className={`w-full text-left px-5 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors ${language === "th" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 font-medium hover:text-blue-700"}`}
                    >
                        <span className="fi fi-th rounded-sm overflow-hidden text-lg" /> ไทย
                    </button>
                    <button
                        onClick={() => { setLanguage("en"); setOpen(false) }}
                        className={`w-full text-left px-5 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors ${language === "en" ? "bg-blue-50 text-blue-700 font-bold border-t border-blue-100" : "text-slate-700 font-medium border-t border-slate-50 hover:text-blue-700"}`}
                    >
                        <span className="fi fi-gb rounded-sm overflow-hidden text-lg" /> English
                    </button>
                </div>
            )}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>}
        </div>
    );
}