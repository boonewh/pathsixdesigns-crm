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
    howItWorks: "This report looks at all your leads and groups them by status (new, contacted, qualified, lost, converted). It also shows your projects grouped by status (pending, won, lost) along with the total value in each category.",
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
      "Projects sitting in 'pending' too long",
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
    howItWorks: "The system counts all leads created in your selected time period, then calculates what percentage reached 'converted' status. It also tracks the average number of days between lead creation and conversion.",
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
      "How many projects each client has",
      "Split between won revenue and pending opportunities",
      "Predicted future revenue based on current pipeline"
    ],
    howItWorks: "The system adds up all project values for each client, separating won projects (done deals) from pending projects (still in progress). For forecasting, it applies probability weights based on project status (pending: 30%, won: 100%, lost: 0%).",
    dataUsed: [
      "All projects linked to each client",
      "Project values and statuses",
      "Historical win rates",
      "Optional date range filters"
    ],
    bestUsedFor: [
      "Account management prioritization",
      "Upselling and cross-selling opportunities",
      "Revenue planning and forecasting",
      "Cash flow projections"
    ],
    whatToWatchFor: [
      "Clients with large pending values (need attention)",
      "One-project clients (upsell opportunity)",
      "High-value clients with no recent activity (retention risk)",
      "Heavy dependence on a few large deals"
    ],
    proTip: "Compare your forecast to actual results each quarter. If reality is very different, adjust expectations accordingly."
  },

  activity: {
    id: "activity",
    title: "Activity Reports",
    whatItShows: [
      "How engaged each team member is with the CRM",
      "Tasks and follow-ups that are past due",
      "Clients with no recent contact (going cold)",
      "Scheduled meetings and upcoming tasks"
    ],
    howItWorks: "The system tracks interactions, assignments, and scheduled follow-ups. It flags overdue items and identifies contacts that haven't had interaction in 30+ days. It also shows upcoming tasks for planning purposes.",
    dataUsed: [
      "Interaction records created by each user",
      "Lead and client assignments",
      "Scheduled follow-up dates",
      "Last interaction date for clients and leads"
    ],
    bestUsedFor: [
      "Daily task management",
      "Preventing leads from going cold",
      "Ensuring CRM adoption across the team",
      "Workload balancing"
    ],
    whatToWatchFor: [
      "Long lists of overdue items (need to catch up)",
      "Valuable clients appearing in the inactive list",
      "Zero or very low activity (not using the system)",
      "Extreme imbalances in workload distribution"
    ],
    proTip: "Check this report every morning. Set aside time to handle overdue items first, then reach out to at-risk contacts.",
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
