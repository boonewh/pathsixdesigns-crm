import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: DateRangePickerProps) {
  const invalid = Boolean(startDate && endDate && startDate > endDate);
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by Date Range</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="report-start-date" className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
          <input
            id="report-start-date"
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="report-end-date" className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
          <input
            id="report-end-date"
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <button
          onClick={() => onApply(startDate, endDate)}
          disabled={invalid}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors"
        >
          Apply Filter
        </button>

        <button className="border border-gray-300 px-4 py-2 rounded-md text-sm" onClick={() => {
          const today = new Date();
          const end = today.toISOString().slice(0, 10);
          today.setUTCDate(today.getUTCDate() - 6);
          const start = today.toISOString().slice(0, 10);
          onStartDateChange(start);
          onEndDateChange(end);
          onApply(start, end);
        }}>Last 7 days</button>
        {invalid && <p role="alert" className="text-sm text-red-600">Start date must be on or before end date.</p>}

        {(startDate || endDate) && (
          <button
            onClick={() => {
              onStartDateChange("");
              onEndDateChange("");
              onApply("", "");
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
