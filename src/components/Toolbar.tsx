import { useAllocationStore } from "../store/allocationStore";

export function Toolbar() {
    const {
        searchQuery,
        filterType,
        filterStatus,
        setSearchQuery,
        setFilterType,
        setFilterStatus,
        runAutoAllocation,
        resetAllocation,
        isAutoAllocating,
        autoAllocateDone,
        getFilteredSubOrders,
    } = useAllocationStore();

    const filtered = getFilteredSubOrders();

    return (
        <div className="card p-4 flex flex-col lg:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-72">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        className="input-field w-full pl-9 pr-8"
                        placeholder="ค้นหา Order ID, Sub Order, Customer, Item..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1" onClick={() => setSearchQuery("")}>×</button>
                    )}
                </div>

                <select
                    className="input-field py-2 bg-white"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="ALL">ทุกประเภท</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="DAILY">DAILY</option>
                </select>

                <select
                    className="input-field py-2 bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="UNALLOCATED">ยังไม่จัดสรร</option>
                    <option value="PARTIAL">บางส่วน</option>
                    <option value="ALLOCATED">จัดสรรแล้ว</option>
                    <option value="CREDIT_EXCEEDED">เกิน Credit</option>
                </select>

                <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">{filtered.length} รายการ</span>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <button
                    className="btn btn-ghost w-full sm:w-auto"
                    onClick={resetAllocation}
                    disabled={isAutoAllocating}
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    รีเซ็ต
                </button>
                <button
                    className={`btn btn-primary w-full sm:w-auto flex-1 ${isAutoAllocating ? "opacity-75 cursor-wait" : ""}`}
                    onClick={runAutoAllocation}
                    disabled={isAutoAllocating}
                >
                    {isAutoAllocating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            กำลังจัดสรร...
                        </>
                    ) : autoAllocateDone ? (
                        <>
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            รันใหม่อีกครั้ง
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Auto Allocate
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}