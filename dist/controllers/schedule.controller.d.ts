import { Request, Response } from 'express';
export declare const createTrainingSchedule: (req: Request, res: Response) => Promise<void>;
export declare const getTrainingSchedules: (req: Request, res: Response) => Promise<void>;
export declare const getTrainingScheduleById: (req: Request, res: Response) => Promise<void>;
export declare const updateTrainingSchedule: (req: Request, res: Response) => Promise<void>;
export declare const cancelTrainingSchedule: (req: Request, res: Response) => Promise<void>;
export declare const registerForSchedule: (req: Request, res: Response) => Promise<void>;
export declare const cancelScheduleRegistration: (req: Request, res: Response) => Promise<void>;
export declare const checkInMember: (req: Request, res: Response) => Promise<void>;
export declare const checkOutMember: (req: Request, res: Response) => Promise<void>;
export declare const getAttendanceLogs: (req: Request, res: Response) => Promise<void>;
export declare const getTodayAttendance: (req: Request, res: Response) => Promise<void>;
export declare const getAttendanceStatistics: (req: Request, res: Response) => Promise<void>;
export declare const getSchedulesByDate: (req: Request, res: Response) => Promise<void>;
export declare const getUpcomingSchedules: (req: Request, res: Response) => Promise<void>;
export declare const getTrainerSchedules: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=schedule.controller.d.ts.map