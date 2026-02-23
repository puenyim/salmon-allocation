// App.tsx
import { useEffect } from "react"
// import { useAllocationStore } from "./store/allocationStore"
// import { orders } from "./data/mockData"
// import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { SummaryBar } from "./components/SummaryBar";
import { OrderTable } from "./components/OrderTable";
import { Toolbar } from "./components/Toolbar";
import { useAllocationStore } from "./store/allocationStore";



function App() {
  // const { t } = useTranslation();

  const { runAutoAllocation, isAutoAllocating } = useAllocationStore();

  useEffect(() => {
    runAutoAllocation();
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <header className="glass-header px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl drop-shadow-md hover:scale-110 transition-transform cursor-default">🐟</div>
          <div>
            <h1 className="text-3xl font-bold bg-linear-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Salmon Allocation</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5 tracking-wide">ระบบจัดสรรปลาแซลมอนให้คำสั่งซื้อลูกค้า</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAutoAllocating && (
            <div className="flex items-center gap-2 text-blue-700 font-semibold bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-sm animate-pulse">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>กำลังรันการจัดสรรอัตโนมัติ...</span>
            </div>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <div className="p-2">
        <SummaryBar />
        {/* <LogPanel /> */}
        <Toolbar />
        <OrderTable />
      </div>
    </div>
  )
}

export default App