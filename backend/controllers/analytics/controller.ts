import { analyticsService } from '@/backend/services/analytics/services';
import { CustomRequest } from '@/backend/utils/interceptor';

export class AnalyticsController {
  async getProjectAnalytics(_request: CustomRequest, projectId: string) {
    const data = await analyticsService.getProjectAnalytics(projectId);
    return { data };
  }
}

export const analyticsController = new AnalyticsController();
