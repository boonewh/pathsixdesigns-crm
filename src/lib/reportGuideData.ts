export interface ReportGuide {
  id: string;
  title: string;
  whatItShows: string[];
  howItWorks: string;
  dataUsed: string[];
  bestUsedFor: string[];
  whatToWatchFor: string[];
  proTip?: string;
  adminOnly?: boolean;
}

export const reportGuides: Record<string, ReportGuide> = {
  pipeline: {
    id: "pipeline",
    title: "Sales Pipeline Report",
    whatItShows: [
      "Current leads at each stage of your sales process",
      "Active projects and their total dollar values",
      "Overall health of your sales funnel"
    ],
    howItWorks: "This report looks at all your leads and groups them by their current status. It also shows your projects grouped by status (active, completed, lost) along with the total value in each category. Status names may vary depending on your CRM configuration.",
    dataUsed: [
      "Lead records with their current status",
      "Project records with status and dollar values",
      "Date range filters (optional)"
    ],
    bestUsedFor: [
      "Daily/weekly pipeline reviews",
      "Identifying bottlenecks in your sales process",
      "Forecasting which deals are moving forward",
      "Team meetings to discuss active opportunities"
    ],
    whatToWatchFor: [
      "Too many leads stuck in one stage (indicates bottleneck)",
      "Projects sitting in active status too long",
      "Conversion drops between stages"
    ]
  },

  sources: {
    id: "sources",
    title: "Lead Source Report",
    whatItShows: [
      "Which marketing channels bring you the most leads",
      "Conversion rates for each source (how many become customers)",
      "Which sources deliver your best quality leads"
    ],
    howItWorks: "The system tracks where each lead came from (website, referral, cold call, email campaign, social media, trade show, advertisement, partner, or other). It then calculates how many leads from each source converted to customers and what percentage that represents.",
    dataUsed: [
      "Lead source field for each lead",
      "Lead status (to determine conversions)",
      "Total lead count per source"
    ],
    bestUsedFor: [
      "Marketing ROI analysis",
      "Budget allocation decisions (invest more in high-performing sources)",
      "Identifying which channels to expand or cut",
      "Sales team training (what works best)"
    ],
    whatToWatchFor: [
      "Low conversion sources (might need better qualification)",
      "High-volume but low-quality sources",
      "Sources with small sample sizes (need more data)"
    ],
    proTip: "Leads must have a source assigned for this report to be accurate. Update older leads if needed."
  },

  conversion: {
    id: "conversion",
    title: "Conversion Rate Report",
    whatItShows: [
      "Overall percentage of leads that become paying customers",
      "How long it typically takes to close a deal",
      "Individual team member performance (admin view)"
    ],
    howItWorks: "The system counts all leads created in your selected time period, then calculates what percentage reached 'won' status — either manually or by using the Convert to Client button. It also tracks the average number of days between lead creation and conversion. Leads that were converted to clients are included in this count even after they are removed from the leads list.",
    dataUsed: [
      "Total leads created",
      "Number of converted leads",
      "Dates of creation and conversion",
      "Assignment data (for per-user breakdown)"
    ],
    bestUsedFor: [
      "Setting realistic sales goals",
      "Identifying top performers",
      "Spotting team members who need coaching",
      "Benchmarking your sales process over time"
    ],
    whatToWatchFor: [
      "Declining conversion rates (process problem?)",
      "Increasing time-to-convert (deals stalling?)",
      "Wide variation between team members (training opportunity?)"
    ],
    adminOnly: true
  },

  revenue: {
    id: "revenue",
    title: "Revenue Reports",
    whatItShows: [
      "Your top clients by total project value",
      "Split between completed revenue and active (in-progress) opportunities",
      "Predicted future revenue based on your current pipeline",
      "Monthly and annual recurring revenue from subscriptions (if enabled)"
    ],
    howItWorks: "Revenue is tracked in two separate buckets that are never double-counted. Project revenue comes from projects linked to clients — completed projects count as earned, active projects count as pipeline. Subscription revenue (if your plan includes it) comes from recurring billing records on client accounts and shows MRR and ARR separately. For forecasting, probability weights are applied by status: active projects at 30%, completed at 100%, lost at 0%.",
    dataUsed: [
      "All projects linked to each client",
      "Project values, statuses, and billing types (one-time, monthly, yearly)",
      "Subscription records (if subscriptions are enabled)",
      "Optional date range filters"
    ],
    bestUsedFor: [
      "Understanding true recurring revenue vs one-time project income",
      "Account management prioritization",
      "Revenue planning and forecasting",
      "Identifying upsell and cross-sell opportunities"
    ],
    whatToWatchFor: [
      "Clients with large active project values (need attention to close)",
      "One-project clients with no subscription (upsell opportunity)",
      "High-value clients with no recent activity (retention risk)",
      "Heavy dependence on a few large one-time deals (revenue volatility)"
    ],
    proTip: "If your business model is subscription-first (you build first, then charge monthly), keep projects at $0 and track all recurring income through subscriptions. Your MRR and ARR are then your real business health metrics. If you charge for both project work and subscriptions, both will appear as separate line items — they are never combined."
  },

  activity: {
    id: "activity",
    title: "Activity Reports",
    whatItShows: [
      "Leads, clients and projects entered by each salesperson",
      "Interactions entered, edits, deletions and record views",
      "A dated list of the records and actions behind the totals",
      "Historical activity for active and inactive team members"
    ],
    howItWorks: "Activity is credited to the person who performed it, not the current assignee. Apply a date range or Last 7 days, then select a salesperson to inspect their work. All report dates use UTC and include the entire end date. Clear returns to all recorded history.",
    dataUsed: [
      "Record creators and creation timestamps",
      "Saved activity logs with the person who performed each action",
      "Latest historical edits where a complete log is unavailable",
      "Legacy interactions shown without attribution when the author was not recorded"
    ],
    bestUsedFor: [
      "Reviewing work performed during a week",
      "Seeing which records a salesperson entered or changed",
      "Following up on team activity",
      "Preparing sales coaching conversations"
    ],
    whatToWatchFor: [
      "Older interactions may have no recorded author",
      "Older edits may show only the latest saved edit, not a complete history",
      "Record views are shown separately from entries and changes",
      "Activity counts reflect recorded CRM work, not all work performed outside the CRM"
    ],
    proTip: "Choose Last 7 days and a salesperson, then review the activity details alongside their totals. Private chat messages are not included.",
    adminOnly: true
  },

  overview: {
    id: "overview",
    title: "Reports Overview",
    whatItShows: [
      "Combined view of Pipeline, Lead Sources, and Conversion Rate",
      "Quick snapshot of your sales health",
      "Key metrics at a glance"
    ],
    howItWorks: "This view combines your most important reports on one screen, giving you a comprehensive overview of your sales performance without switching between tabs.",
    dataUsed: [
      "All data from Pipeline Report",
      "All data from Lead Source Report",
      "All data from Conversion Rate Report"
    ],
    bestUsedFor: [
      "Daily check-ins on overall performance",
      "Quick status updates for team meetings",
      "Identifying which detailed report to dive into",
      "High-level health checks"
    ],
    whatToWatchFor: [
      "Any red flags in pipeline flow",
      "Conversion rate trends",
      "Source performance anomalies"
    ]
  }
};

export const generalTips = {
  dateRanges: {
    title: "Using Date Ranges",
    tips: [
      "Compare this month vs. last month",
      "Analyze seasonal trends",
      "Focus on recent activity vs. historical data",
      "Generate monthly/quarterly board reports"
    ]
  },
  reviewSchedule: {
    title: "Recommended Review Schedule",
    schedule: {
      daily: ["Follow-Up Report", "Upcoming Tasks Report"],
      weekly: ["Sales Pipeline Report", "User Activity Report (managers)"],
      monthly: ["All revenue and performance reports"],
      quarterly: ["Retention", "Conversion Rate", "Lead Source (for strategic decisions)"]
    }
  },
  dataQuality: {
    title: "Data Quality Matters",
    points: [
      "Keep lead sources up to date",
      "Log all client interactions",
      "Update project statuses promptly",
      "Schedule follow-ups consistently",
      "Assign ownership clearly"
    ]
  }
};
