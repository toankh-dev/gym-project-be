import { Request, Response } from 'express';
export declare class SubscriptionController {
    private subscriptionService;
    constructor();
    getSubscriptions: (req: Request, res: Response) => Promise<void>;
    getSubscriptionById: (req: Request, res: Response) => Promise<void>;
    getMemberSubscriptions: (req: Request, res: Response) => Promise<void>;
    getCurrentMemberSubscription: (req: Request, res: Response) => Promise<void>;
    createSubscription: (req: Request, res: Response) => Promise<void>;
    updateSubscription: (req: Request, res: Response) => Promise<void>;
    cancelSubscription: (req: Request, res: Response) => Promise<void>;
    renewSubscription: (req: Request, res: Response) => Promise<void>;
    getSubscriptionStatistics: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=subscription.controller.d.ts.map