import { useCRMConfig } from "@/config/crmConfig";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Calendar, TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { getReportGuides, getGeneralTips } from "@/lib/reportGuideData";

export default function HelpPage() {
  const config = useCRMConfig();
  const reportGuides = getReportGuides(config.labels.client);
  const generalTips = getGeneralTips(config.labels.client);
  const [expandedSection, setExpandedSection] = useState<string | null>("pipeline");

  const reportSections = [
    { id: "overview", icon: BookOpen },
    { id: "pipeline", icon: TrendingUp },
    { id: "sources", icon: Target },
    { id: "conversion", icon: Users },
    { id: "revenue", icon: DollarSign },
    { id: "activity", icon: Calendar },
  ];

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Reports guide</h1>
        <p className="text-muted-foreground">
          Learn how to use each report effectively to manage your business and make data-driven decisions.
        </p>
      </div>

      {/* Quick Tips Card */}
      <div className="bg-white border rounded-lg p-4 mb-8">
        <h2 className="text-base font-semibold mb-2">Getting started</h2>
        <p className="text-sm mb-3">
          Click on any report below to learn what it shows, how it works, and how to use it effectively.
          Each report helps you understand different aspects of your business performance.
        </p>
        <div className="text-sm text-muted-foreground">
          <strong>Tip:</strong> You can also click the help icon (?) next to each report tab on the Reports page for quick access to this information.
        </div>
      </div>

      {/* Report Sections - Accordion Style */}
      <div className="space-y-3 mb-10">
        <h2 className="text-lg font-semibold mb-3">Available reports</h2>

        {reportSections.map((section) => {
          const guide = reportGuides[section.id];
          if (!guide) return null;

          const isExpanded = expandedSection === section.id;
          const SectionIcon = section.icon;

          return (
            <div
              key={section.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SectionIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold">{guide.title}</h3>
                  {guide.adminOnly && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      Admin Only
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-4 py-5 border-t space-y-5">
                  {/* What It Shows */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">What It Shows</h4>
                    <ul className="space-y-1.5">
                      {guide.whatItShows.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* How It Works */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">How It Works</h4>
                    <p className="text-sm leading-relaxed">{guide.howItWorks}</p>
                  </div>

                  {/* Best Used For */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Best Used For</h4>
                    <ul className="space-y-1.5">
                      {guide.bestUsedFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What to Watch For */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">What to Watch For</h4>
                    <ul className="space-y-1.5">
                      {guide.whatToWatchFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pro Tip */}
                  {guide.proTip && (
                    <div className="bg-muted/60 rounded-md p-3">
                      <p className="text-sm">
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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">General tips</h2>

        {/* Date Ranges */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3">{generalTips.dateRanges.title}</h3>
          <ul className="space-y-2">
            {generalTips.dateRanges.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Review Schedule */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3">{generalTips.reviewSchedule.title}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(generalTips.reviewSchedule.schedule).map(([frequency, reports]) => (
              <div key={frequency}>
                <h4 className="text-sm font-semibold capitalize mb-2">{frequency}</h4>
                <ul className="space-y-1">
                  {reports.map((report, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground ml-4">• {report}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3">{generalTips.dataQuality.title}</h3>
          <p className="text-sm mb-3">These reports are only as good as your data:</p>
          <ul className="space-y-2">
            {generalTips.dataQuality.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t text-sm text-center text-muted-foreground">
        <p>Need more help? Contact your CRM administrator or sales manager.</p>
      </div>
    </div>
  );
}
