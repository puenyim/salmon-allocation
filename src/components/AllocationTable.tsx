
import { useMemo } from "react";
import { useOrderStore } from "../store/useOrderStore";
import type { RowData } from "../types";

const PAGE_SIZE = 25;
function AllocationTable() {
  const { rows, search, currentPage, setSearch, setPage } =
    useOrderStore();

  // filter by orderId
  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      row.orderId.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  const paginatedData = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <>
      <div className="p-4 space-y-4 h-[calc(100vh-200px)]">
        {/* Search Box */}
        <input
          type="text"
          placeholder="Search Order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-1 rounded w-64"
        />

        {/* Table */}
        <table className="w-full border border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th>Order</th>
              <th>Sub Order</th>
              <th>Item ID</th>
              <th>Warehouse ID</th>
              <th>Supplier ID</th>
              <th>Request</th>
              <th>Type</th>
              <th>Create Date</th>
              <th>Customer ID</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row: RowData) => (
              <tr key={row.subOrderId} className="border-t">
                <td>{row.orderId}</td>
                <td>{row.subOrderId}</td>
                <td>{row.itemId}</td>
                <td>{row.warehouseId}</td>
                <td>{row.supplierId}</td>
                <td>{row.requestQty}</td>
                <td>{row.type}</td>
                <td>{row.createDate}</td>
                <td>{row.customerId}</td>
                <td>{row.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>

        <span>
          Page {currentPage} / {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setPage(currentPage + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </>

  );
}

export default AllocationTable