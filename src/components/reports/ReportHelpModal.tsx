import { X, Info, CheckCircle2, TrendingUp, Database, AlertCircle, Lightbulb } from "lucide-react";
import { ReportGuide } from "@/lib/reportGuideData";

interface ReportHelpModalProps {
  guide: ReportGuide;
  onClose: () => void;
}

export default function ReportHelpModal({ guide, onClose }: ReportHelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{guide.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close help"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* What It Shows */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">What It Shows</h3>
            </div>
            <ul className="space-y-2">
              {guide.whatItShows.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* How It Works */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">How It Works</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{guide.howItWorks}</p>
          </section>

          {/* Data Used */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Data Used</h3>
            </div>
            <ul className="space-y-2">
              {guide.dataUsed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Best Used For */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Best Used For</h3>
            </div>
            <ul className="space-y-2">
              {guide.bestUsedFor.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What to Watch For */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">What to Watch For</h3>
            </div>
            <ul className="space-y-2">
              {guide.whatToWatchFor.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pro Tip (if available) */}
          {guide.proTip && (
            <section className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                  <p className="text-blue-800">{guide.proTip}</p>
                </div>
              </div>
            </section>
          )}

          {/* Admin Only Badge (if applicable) */}
          {guide.adminOnly && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800 font-medium">
                <span className="inline-block px-2 py-1 bg-purple-100 rounded text-xs mr-2">ADMIN ONLY</span>
                This report is only visible to administrators.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
