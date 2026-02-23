import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import App from './App.tsx'
import i18n from "./i18n";
import { useLanguageStore } from "./store/useLanguageStore";


const savedLang = localStorage.getItem("lang") || "th";
i18n.changeLanguage(savedLang);
useLanguageStore.setState({ language: savedLang as "th" | "en" });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
