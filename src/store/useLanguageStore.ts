import { create } from "zustand";
import i18n from "../i18n";

type Language = "th" | "en";

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    language: (localStorage.getItem("lang") as Language) || "th",

    setLanguage: (lang) => {
        localStorage.setItem("lang", lang);
        i18n.changeLanguage(lang);
        set({ language: lang });
    },
}));