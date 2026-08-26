import { dashboardService } from '@/backend/services/dashboard/services';
import { CustomRequest } from '@/backend/utils/interceptor';

export class DashboardController {
  /**
   * GET /api/dashboard
   * Cross-project activity, project summaries, and the current user's todos
   */
  async getDashboard(request: CustomRequest) {
    const data = await dashboardService.getDashboard(
      request.userInfo.id,
      request.scopeInfo.scope_name
    );
    return { data };
  }
}

export const dashboardController = new DashboardController();
