import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by Date Range</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <button
          onClick={onApply}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors"
        >
          Apply Filter
        </button>

        {(startDate || endDate) && (
          <button
            onClick={() => {
              onStartDateChange("");
              onEndDateChange("");
              onApply();
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
