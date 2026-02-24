// App.tsx
import { useEffect } from "react"
// import { useAllocationStore } from "./store/allocationStore"
// import { orders } from "./data/mockData"
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { SummaryBar } from "./components/SummaryBar";
import { OrderTable } from "./components/OrderTable";
import { Toolbar } from "./components/Toolbar";
import { useAllocationStore } from "./store/allocationStore";



function App() {
  const { t } = useTranslation();

  const { runAutoAllocation } = useAllocationStore();

  useEffect(() => {
    runAutoAllocation();
  }, [runAutoAllocation]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <header className="glass-header px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl drop-shadow-md hover:scale-110 transition-transform cursor-default">🐟</div>
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">{t("appTitle")}</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5 tracking-wide">{t("appDescription")}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="p-2">
        <SummaryBar />
        <Toolbar />
        <OrderTable />
      </div>
    </div>
  )
}

export default App