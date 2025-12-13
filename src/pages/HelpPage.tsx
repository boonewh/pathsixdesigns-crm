import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Calendar, TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { reportGuides, generalTips } from "@/lib/reportGuideData";

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("pipeline");

  const reportSections = [
    { id: "overview", icon: BookOpen, color: "text-gray-600" },
    { id: "pipeline", icon: TrendingUp, color: "text-blue-600" },
    { id: "sources", icon: Target, color: "text-green-600" },
    { id: "conversion", icon: Users, color: "text-purple-600" },
    { id: "revenue", icon: DollarSign, color: "text-emerald-600" },
    { id: "activity", icon: Calendar, color: "text-amber-600" },
  ];

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports User Guide</h1>
        <p className="text-gray-600 text-lg">
          Learn how to use each report effectively to manage your business and make data-driven decisions.
        </p>
      </div>

      {/* Quick Tips Card */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">Getting Started</h2>
        <p className="text-blue-800 mb-4">
          Click on any report below to learn what it shows, how it works, and how to use it effectively.
          Each report helps you understand different aspects of your business performance.
        </p>
        <div className="text-sm text-blue-700">
          <strong>Tip:</strong> You can also click the help icon (?) next to each report tab on the Reports page for quick access to this information.
        </div>
      </div>

      {/* Report Sections - Accordion Style */}
      <div className="space-y-4 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Reports</h2>

        {reportSections.map((section) => {
          const guide = reportGuides[section.id];
          if (!guide) return null;

          const isExpanded = expandedSection === section.id;
          const SectionIcon = section.icon;

          return (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SectionIcon className={`h-6 w-6 ${section.color}`} />
                  <h3 className="text-lg font-semibold text-gray-900">{guide.title}</h3>
                  {guide.adminOnly && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      Admin Only
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 space-y-6">
                  {/* What It Shows */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What It Shows</h4>
                    <ul className="space-y-1.5">
                      {guide.whatItShows.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                          <span className={`${section.color} mt-1`}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* How It Works */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">How It Works</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{guide.howItWorks}</p>
                  </div>

                  {/* Best Used For */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Best Used For</h4>
                    <ul className="space-y-1.5">
                      {guide.bestUsedFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What to Watch For */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What to Watch For</h4>
                    <ul className="space-y-1.5">
                      {guide.whatToWatchFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pro Tip */}
                  {guide.proTip && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm text-blue-900">
                        <strong className="font-semibold">Pro Tip:</strong> {guide.proTip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* General Tips Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">General Tips</h2>

        {/* Date Ranges */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{generalTips.dateRanges.title}</h3>
          <ul className="space-y-2">
            {generalTips.dateRanges.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-500 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Review Schedule */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{generalTips.reviewSchedule.title}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(generalTips.reviewSchedule.schedule).map(([frequency, reports]) => (
              <div key={frequency}>
                <h4 className="font-semibold text-gray-800 capitalize mb-2">{frequency}</h4>
                <ul className="space-y-1">
                  {reports.map((report, idx) => (
                    <li key={idx} className="text-sm text-gray-600 ml-4">• {report}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">{generalTips.dataQuality.title}</h3>
          <p className="text-amber-800 mb-3">These reports are only as good as your data:</p>
          <ul className="space-y-2">
            {generalTips.dataQuality.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-amber-800">
                <span className="text-amber-600 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-600">
        <p>Need more help? Contact your CRM administrator or sales manager.</p>
      </div>
    </div>
  );
}
