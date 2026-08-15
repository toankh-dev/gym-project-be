import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

interface NotFoundResponse {
  success: false;
  error: {
    message: string;
    code: string;
    path: string;
    method: string;
    timestamp: string;
    suggestions?: string[];
  };
}

export const notFoundHandler = (req: Request, res: Response, _: NextFunction): void => {
  // Log 404 attempts for monitoring
  logger.warn('404 Not Found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  });

  // Generate helpful suggestions based on the requested path
  const suggestions: string[] = [];
  const path = req.originalUrl.toLowerCase();

  // API endpoint suggestions
  if (path.startsWith('/api')) {
    suggestions.push('Check if the API version is correct (e.g., /api/v1/)');
    suggestions.push('Verify the endpoint exists in the API documentation');

    // Specific endpoint suggestions
    if (path.includes('member')) {
      suggestions.push('Did you mean: /api/members, /api/members/:id, or /api/members/:id/profile?');
    } else if (path.includes('trainer')) {
      suggestions.push('Did you mean: /api/trainers, /api/trainers/:id, or /api/trainers/:id/schedules?');
    } else if (path.includes('auth')) {
      suggestions.push('Did you mean: /api/auth/login, /api/auth/register, or /api/auth/logout?');
    } else if (path.includes('schedule')) {
      suggestions.push('Did you mean: /api/schedules, /api/schedules/:id, or /api/schedules/:id/book?');
    } else if (path.includes('payment')) {
      suggestions.push('Did you mean: /api/payments, /api/payments/member/:id, or /api/payments/:id/receipt?');
    } else {
      suggestions.push('Available endpoints: /auth, /members, /trainers, /schedules, /payments, /analytics');
    }
  } else {
    // Non-API suggestions
    suggestions.push('This is an API server. Try accessing /api/health for status');
    suggestions.push('Static files are served from /uploads/');
    suggestions.push('Frontend should be accessed through the main domain');
  }

  const response: NotFoundResponse = {
    success: false,
    error: {
      message: `The requested resource '${req.originalUrl}' was not found`,
      code: 'NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    }
  };

  res.status(404).json(response);
};