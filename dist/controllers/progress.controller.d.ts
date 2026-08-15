import { Request, Response } from 'express';
export declare class ProgressController {
    private progressService;
    constructor();
    getMemberProgress: (req: Request, res: Response) => Promise<void>;
    getCurrentMemberProgress: (req: Request, res: Response) => Promise<void>;
    createProgressEntry: (req: Request, res: Response) => Promise<void>;
    updateMemberProfile: (req: Request, res: Response) => Promise<void>;
    updateCurrentMemberProfile: (req: Request, res: Response) => Promise<void>;
    getProgressStatistics: (req: Request, res: Response) => Promise<void>;
    getWorkoutProgress: (req: Request, res: Response) => Promise<void>;
    createWorkoutLog: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=progress.controller.d.ts.map