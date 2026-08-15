import { Request, Response } from 'express';
export declare class PaymentController {
    private paymentService;
    constructor();
    getPayments: (req: Request, res: Response) => Promise<void>;
    getPaymentById: (req: Request, res: Response) => Promise<void>;
    createPayment: (req: Request, res: Response) => Promise<void>;
    updatePaymentStatus: (req: Request, res: Response) => Promise<void>;
    simulatePayment: (req: Request, res: Response) => Promise<void>;
    getMemberPayments: (req: Request, res: Response) => Promise<void>;
    getCurrentMemberPayments: (req: Request, res: Response) => Promise<void>;
    getPaymentStatistics: (req: Request, res: Response) => Promise<void>;
    processSubscriptionPayment: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=payment.controller.d.ts.map