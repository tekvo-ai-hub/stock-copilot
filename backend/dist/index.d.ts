declare class StockCopilotBackend {
    private app;
    private server;
    private io;
    private port;
    constructor();
    private initializeServices;
    private initializeMiddleware;
    private initializeRoutes;
    private initializeWebSocket;
    private initializeErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
}
declare const backend: StockCopilotBackend;
export default backend;
//# sourceMappingURL=index.d.ts.map