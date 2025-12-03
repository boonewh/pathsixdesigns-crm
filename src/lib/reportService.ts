import { apiFetch } from "@/lib/api";

// Types based on REPORTS_API_GUIDE.md
export interface PipelineData {
  status: string;
  count: number;
  percentage: number;
}

export interface LeadSourceData {
  source: string;
  count: number;
  conversion_rate: number;
}

export interface ConversionRateData {
  period: string;
  converted: number;
  total: number;
  rate: number;
}

export interface RevenueByClientData {
  client_name: string;
  total_revenue: number;
  project_count: number;
}

export interface UserActivityData {
  user_email: string;
  leads_created: number;
  clients_created: number;
  interactions_logged: number;
}

export interface FollowUpData {
  id: number;
  title: string;
  due_date: string;
  assigned_to: string;
  priority: string;
  entity_type: string;
  entity_name: string;
}

export interface ClientRetentionData {
  cohort: string;
  retained_clients: number;
  total_clients: number;
  retention_rate: number;
}

export interface ProjectPerformanceData {
  project_name: string;
  status: string;
  completion_percentage: number;
  days_remaining: number;
  budget_used: number;
}

export interface UpcomingTaskData {
  id: number;
  title: string;
  due_date: string;
  assigned_to: string;
  entity_type: string;
  entity_name: string;
}

export interface RevenueForecastData {
  month: string;
  projected_revenue: number;
  confidence: string;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  status?: string;
  limit?: number;
}

class ReportService {
  private async fetchReport<T>(endpoint: string, filters: ReportFilters = {}): Promise<T> {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.user_id) params.append("user_id", filters.user_id.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.limit) params.append("limit", filters.limit.toString());

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

  async getPipeline(filters?: ReportFilters): Promise<PipelineData[]> {
    const data = await this.fetchReport<{ pipeline: PipelineData[] }>("pipeline", filters);
    return data.pipeline;
  }

  async getLeadSource(filters?: ReportFilters): Promise<LeadSourceData[]> {
    const data = await this.fetchReport<{ sources: LeadSourceData[] }>("lead-source", filters);
    return data.sources;
  }

  async getConversionRate(filters?: ReportFilters): Promise<ConversionRateData[]> {
    const data = await this.fetchReport<{ conversion_data: ConversionRateData[] }>("conversion-rate", filters);
    return data.conversion_data;
  }

  async getRevenueByClient(filters?: ReportFilters): Promise<RevenueByClientData[]> {
    const data = await this.fetchReport<{ revenue: RevenueByClientData[] }>("revenue-by-client", filters);
    return data.revenue;
  }

  async getUserActivity(filters?: ReportFilters): Promise<UserActivityData[]> {
    const data = await this.fetchReport<{ activity: UserActivityData[] }>("user-activity", filters);
    return data.activity;
  }

  async getFollowUps(filters?: ReportFilters): Promise<FollowUpData[]> {
    const data = await this.fetchReport<{ follow_ups: FollowUpData[] }>("follow-ups", filters);
    return data.follow_ups;
  }

  async getClientRetention(filters?: ReportFilters): Promise<ClientRetentionData[]> {
    const data = await this.fetchReport<{ retention: ClientRetentionData[] }>("client-retention", filters);
    return data.retention;
  }

  async getProjectPerformance(filters?: ReportFilters): Promise<ProjectPerformanceData[]> {
    const data = await this.fetchReport<{ projects: ProjectPerformanceData[] }>("project-performance", filters);
    return data.projects;
  }

  async getUpcomingTasks(filters?: ReportFilters): Promise<UpcomingTaskData[]> {
    const data = await this.fetchReport<{ tasks: UpcomingTaskData[] }>("upcoming-tasks", filters);
    return data.tasks;
  }

  async getRevenueForecast(filters?: ReportFilters): Promise<RevenueForecastData[]> {
    const data = await this.fetchReport<{ forecast: RevenueForecastData[] }>("revenue-forecast", filters);
    return data.forecast;
  }
}

export const reportService = new ReportService();
