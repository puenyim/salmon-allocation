// App.tsx
import { useEffect } from "react"
// import { useAllocationStore } from "./store/allocationStore"
// import { orders } from "./data/mockData"
import AllocationTable from "./components/AllocationTable"
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";



function App() {
  // const { runAuto } = useAllocationStore()
  const { t } = useTranslation();


  useEffect(() => {
    // runAuto()
  }, [])



  return (
    <div>
      <div className="flex flex-row justify-between p-4 bg-amber-400">
        <h2 className="">{t("welcome")}</h2>
        <div>
          <LanguageSwitcher />
        </div>
      </div>

      <AllocationTable />
    </div>
  )
}

export default App