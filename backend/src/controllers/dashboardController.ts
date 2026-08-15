import { Request, Response } from 'express';
import { getDashboardStats } from '../services/dashboardService';

export function getDashboard(_req: Request, res: Response): void {
  res.json(getDashboardStats());
}
