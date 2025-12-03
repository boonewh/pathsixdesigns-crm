import { useState } from "react";
import { BarChart3, TrendingUp, Target, Activity, DollarSign, Users, Bell } from "lucide-react";
import { PipelineReport } from "@/components/reports/PipelineReport";
import { LeadSourceReport } from "@/components/reports/LeadSourceReport";
import { ConversionRateReport } from "@/components/reports/ConversionRateReport";
import { RevenueReports } from "@/components/reports/RevenueReports";
import { ActivityReports } from "@/components/reports/ActivityReports";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

type ReportTab = "overview" | "pipeline" | "sources" | "conversion" | "revenue" | "activity";

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const tabs = [
    { id: "overview" as ReportTab, label: "Overview", icon: BarChart3 },
    { id: "pipeline" as ReportTab, label: "Pipeline", icon: TrendingUp },
    { id: "sources" as ReportTab, label: "Lead Sources", icon: Target },
    { id: "conversion" as ReportTab, label: "Conversion", icon: Activity },
    { id: "revenue" as ReportTab, label: "Revenue", icon: DollarSign },
    { id: "activity" as ReportTab, label: "Activity", icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={() => {
          // Date filter will be applied when backend supports it
          console.log("Date range:", startDate, endDate);
        }}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <PipelineReport />
            <div className="grid md:grid-cols-2 gap-6">
              <LeadSourceReport />
              <ConversionRateReport />
            </div>
          </div>
        )}

        {activeTab === "pipeline" && <PipelineReport />}
        {activeTab === "sources" && <LeadSourceReport />}
        {activeTab === "conversion" && <ConversionRateReport />}
        {activeTab === "revenue" && <RevenueReports />}
        {activeTab === "activity" && <ActivityReports />}
      </div>
    </div>
  );
}
