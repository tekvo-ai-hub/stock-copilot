import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map