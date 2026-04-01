import { apiFetch } from "@/lib/api";

// ── Pipeline ─────────────────────────────────────────────────────────────────
export interface LeadPipelineItem {
  status: string;
  count: number;
}

export interface ProjectPipelineItem {
  status: string;
  count: number;
  total_value: number;
  by_value_type: Record<string, { count: number; total_value: number }>;
}

export interface PipelineResponse {
  leads: LeadPipelineItem[];
  projects: ProjectPipelineItem[];
}

// ── Lead Source ───────────────────────────────────────────────────────────────
export interface LeadSourceData {
  source: string;
  total_leads: number;
  converted: number;
  qualified: number;
  conversion_rate: number;
}

// ── Conversion Rate ───────────────────────────────────────────────────────────
export interface ConversionOverall {
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  avg_days_to_convert: number | null;
}

export interface ConversionByUser {
  user_id: number;
  user_email: string;
  total_leads: number;
  converted: number;
  conversion_rate: number;
}

export interface ConversionResponse {
  overall: ConversionOverall;
  by_user: ConversionByUser[];
}

// ── Revenue by Client ─────────────────────────────────────────────────────────
export interface ValueTypeBreakdown {
  one_time?: number;
  monthly?: number;
  yearly?: number;
}

export interface RevenueByClientItem {
  client_id: number;
  client_name: string;
  project_count: number;
  won_value: number;
  pending_value: number;
  total_value: number;
  value_type_breakdown: ValueTypeBreakdown;
  mrr: number;
}

// ── User Activity ─────────────────────────────────────────────────────────────
export interface UserActivityData {
  user_id: number;
  email: string;
  interactions: number;
  leads_assigned: number;
  clients_assigned: number;
  activity_count: number;
}

// ── Follow-ups ────────────────────────────────────────────────────────────────
export interface OverdueFollowUp {
  interaction_id: number;
  client_id: number | null;
  lead_id: number | null;
  entity_name: string;
  follow_up_date: string;
  summary: string;
  days_overdue: number;
}

export interface InactiveClient {
  client_id: number;
  name: string;
  last_interaction: string | null;
  days_inactive: number | null;
}

export interface InactiveLead {
  lead_id: number;
  name: string;
  last_interaction: string | null;
  days_inactive: number | null;
}

export interface ConvertedLead {
  lead_id: number;
  name: string;
  lead_source: string | null;
  converted_on: string | null;
  days_in_pipeline: number | null;
  client_id: number | null;
  client_name: string | null;
  assigned_to: string | null;
}

export interface FollowUpsResponse {
  overdue_follow_ups: OverdueFollowUp[];
  inactive_clients: InactiveClient[];
  inactive_leads: InactiveLead[];
}

// ── Revenue Forecast ──────────────────────────────────────────────────────────
export interface ForecastByTypeDetail {
  count: number;
  total_value: number;
  annualized_value: number;
}

export interface ForecastProjectStatus {
  status: string;
  count: number;
  total_value: number;
  annualized_value: number;
  weighted_value: number;
  weight: number;
  by_type: Record<string, ForecastByTypeDetail>;
}

export interface RevenueForecastResponse {
  projects: ForecastProjectStatus[];
  total_weighted_forecast: number;
  mrr_from_projects: number;
  arr_from_projects: number;
  lead_pipeline: LeadPipelineItem[];
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
export interface SubscriptionClientBreakdown {
  client_id: number;
  client_name: string | null;
  subscription_count: number;
  monthly_total: number;
  yearly_total: number;
  mrr: number;
}

export interface SubscriptionIncomeResponse {
  active_subscriptions: number;
  mrr: number;
  arr: number;
  monthly_subscription_count: number;
  yearly_subscription_count: number;
  monthly_revenue: number;
  yearly_revenue: number;
  by_client: SubscriptionClientBreakdown[];
}

export interface UpcomingRenewal {
  subscription_id: number;
  client_id: number;
  client_name: string | null;
  plan_name: string;
  price: number;
  billing_cycle: string;
  renewal_date: string;
  days_until_renewal: number;
}

export interface UpcomingRenewalsResponse {
  days_ahead: number;
  total: number;
  upcoming_renewals: UpcomingRenewal[];
}

// ── Filters ───────────────────────────────────────────────────────────────────
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  status?: string;
  limit?: number;
  days?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────
class ReportService {
  private async fetchReport<T>(endpoint: string, filters: ReportFilters = {}): Promise<T> {
    const params = new URLSearchParams();

    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.user_id) params.append("user_id", filters.user_id.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.days) params.append("days", filters.days.toString());

    const queryString = params.toString();
    const url = queryString ? `/reports/${endpoint}?${queryString}` : `/reports/${endpoint}`;

    const response = await apiFetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint} report`);
    }

    return await response.json();
  }

  async getPipeline(filters?: ReportFilters): Promise<PipelineResponse> {
    return this.fetchReport<PipelineResponse>("pipeline", filters);
  }

  async getLeadSource(filters?: ReportFilters): Promise<LeadSourceData[]> {
    const data = await this.fetchReport<{ sources: LeadSourceData[] }>("lead-source", filters);
    return data.sources ?? [];
  }

  async getConversionRate(filters?: ReportFilters): Promise<ConversionResponse> {
    return this.fetchReport<ConversionResponse>("conversion-rate", filters);
  }

  async getRevenueByClient(filters?: ReportFilters): Promise<RevenueByClientItem[]> {
    const data = await this.fetchReport<{ clients: RevenueByClientItem[] }>("revenue-by-client", filters);
    return data.clients ?? [];
  }

  async getUserActivity(filters?: ReportFilters): Promise<UserActivityData[]> {
    const data = await this.fetchReport<{ users: UserActivityData[] }>("user-activity", filters);
    return data.users ?? [];
  }

  async getFollowUps(filters?: ReportFilters): Promise<FollowUpsResponse> {
    return this.fetchReport<FollowUpsResponse>("follow-ups", filters);
  }

  async getConvertedLeads(filters?: ReportFilters): Promise<ConvertedLead[]> {
    const data = await this.fetchReport<{ converted_leads: ConvertedLead[] }>("converted-leads", filters);
    return data.converted_leads ?? [];
  }

  async getRevenueForecast(filters?: ReportFilters): Promise<RevenueForecastResponse> {
    return this.fetchReport<RevenueForecastResponse>("revenue-forecast", filters);
  }

  async getSubscriptionIncome(filters?: ReportFilters): Promise<SubscriptionIncomeResponse> {
    return this.fetchReport<SubscriptionIncomeResponse>("subscriptions/income", filters);
  }

  async getUpcomingRenewals(filters?: ReportFilters): Promise<UpcomingRenewalsResponse> {
    return this.fetchReport<UpcomingRenewalsResponse>("subscriptions/upcoming-renewals", filters);
  }
}

export const reportService = new ReportService();
