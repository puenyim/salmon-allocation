import { useState } from "react";
import { useLanguageStore } from "../store/useLanguageStore";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguageStore();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(!open)}
                className="border px-3 py-1 rounded flex items-center gap-2 bg-white"
            >
                {language === "th" ? (
                    <>
                        <span className="fi fi-th" /> TH
                    </>
                ) : (
                    <>
                        <span className="fi fi-gb" /> EN
                    </>
                )}
            </button>

            {open && (
                <div className="absolute mt-1 bg-white border rounded shadow">
                    <div
                        onClick={() => { setLanguage("th"); setOpen(false) }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex gap-2"
                    >
                        <span className="fi fi-th" /> TH
                    </div>
                    <div
                        onClick={() => { setLanguage("en"); setOpen(false) }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex gap-2"
                    >
                        <span className="fi fi-gb" /> EN
                    </div>
                </div>
            )}
        </div>
    );
}