import { z } from 'zod';
declare const PredictionRequestSchema: z.ZodObject<{
    symbol: z.ZodString;
    timeframe: z.ZodEnum<["1d", "1w", "2w", "1m", "3m"]>;
    model: z.ZodEnum<["lstm", "transformer", "ensemble", "hybrid"]>;
    confidence_threshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    model: "lstm" | "transformer" | "ensemble" | "hybrid";
    timeframe: "1m" | "1d" | "1w" | "3m" | "2w";
    confidence_threshold: number;
}, {
    symbol: string;
    model: "lstm" | "transformer" | "ensemble" | "hybrid";
    timeframe: "1m" | "1d" | "1w" | "3m" | "2w";
    confidence_threshold?: number | undefined;
}>;
declare const AnalysisRequestSchema: z.ZodObject<{
    symbol: z.ZodString;
    analysis_type: z.ZodEnum<["technical", "fundamental", "sentiment", "comprehensive"]>;
    indicators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeframe: z.ZodDefault<z.ZodEnum<["1d", "1w", "1m", "3m", "1y"]>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timeframe: "1m" | "1d" | "1w" | "1y" | "3m";
    analysis_type: "technical" | "fundamental" | "sentiment" | "comprehensive";
    indicators?: string[] | undefined;
}, {
    symbol: string;
    analysis_type: "technical" | "fundamental" | "sentiment" | "comprehensive";
    timeframe?: "1m" | "1d" | "1w" | "1y" | "3m" | undefined;
    indicators?: string[] | undefined;
}>;
declare const ChatRequestSchema: z.ZodObject<{
    message: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        symbol: z.ZodOptional<z.ZodString>;
        portfolio: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recent_predictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        symbol?: string | undefined;
        portfolio?: string[] | undefined;
        recent_predictions?: string[] | undefined;
    }, {
        symbol?: string | undefined;
        portfolio?: string[] | undefined;
        recent_predictions?: string[] | undefined;
    }>>;
    chat_history: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        role: "user" | "assistant";
        content: string;
    }, {
        timestamp: string;
        role: "user" | "assistant";
        content: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    context?: {
        symbol?: string | undefined;
        portfolio?: string[] | undefined;
        recent_predictions?: string[] | undefined;
    } | undefined;
    chat_history?: {
        timestamp: string;
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
}, {
    message: string;
    context?: {
        symbol?: string | undefined;
        portfolio?: string[] | undefined;
        recent_predictions?: string[] | undefined;
    } | undefined;
    chat_history?: {
        timestamp: string;
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
}>;
export declare class AIService {
    private static togetherAI;
    private static openAI;
    private static isInitialized;
    static initialize(): Promise<void>;
    static generatePrediction(request: z.infer<typeof PredictionRequestSchema>): Promise<any>;
    static generateAnalysis(request: z.infer<typeof AnalysisRequestSchema>): Promise<any>;
    static handleChat(request: z.infer<typeof ChatRequestSchema>): Promise<{
        response: any;
        usage: any;
        model: string;
        timestamp: string;
    }>;
    static generateEmbedding(text: string): Promise<number[]>;
    private static buildPredictionPrompt;
    private static buildAnalysisPrompt;
    private static buildChatSystemPrompt;
    private static parsePredictionResponse;
    private static parseAnalysisResponse;
}
export {};
//# sourceMappingURL=ai.d.ts.map