import {createWriteStream, existsSync, mkdirSync} from 'fs';
import {join} from 'path';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}

export interface LogEntry {
    timestamp: string;
    level: string;
    service: string;
    message: string;
    data?: any;
    error?: Error;
    requestId?: string;
    userId?: string;
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    private logStream: NodeJS.WritableStream | null = null;
    private logDir: string;

    private constructor() {
        this.logLevel = this.getLogLevelFromEnv();
        this.logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
        this.setupLogDirectory();
        this.setupLogStream();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public error(service: string, message: string, error?: Error, data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;

        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'ERROR',
            service,
            message,
            error,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public warn(service: string, message: string, data?: any, context?: { requestId?: string; userId?: string }): void {
        if (!this.shouldLog(LogLevel.WARN)) return;

        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'WARN',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public info(service: string, message: string, data?: any, context?: { requestId?: string; userId?: string }): void {
        if (!this.shouldLog(LogLevel.INFO)) return;

        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'INFO',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public debug(service: string, message: string, data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;

        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'DEBUG',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public trace(service: string, message: string, data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        if (!this.shouldLog(LogLevel.TRACE)) return;

        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'TRACE',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    // Convenience methods for specific use cases
    public authentication(success: boolean, service: string, identifier: string, context?: {
        requestId?: string
    }): void {
        const message = `Authentication ${success ? 'successful' : 'failed'} for ${identifier}`;
        if (success) {
            this.info(service, message, {identifier}, context);
        } else {
            this.warn(service, message, {identifier}, context);
        }
    }

    public transaction(service: string, action: string, data: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        this.info(service, `Transaction ${action}`, data, context);
    }

    public apiRequest(service: string, method: string, path: string, statusCode: number, duration: number, context?: {
        requestId?: string;
        userId?: string
    }): void {
        const level = statusCode >= 400 ? 'WARN' : 'INFO';
        const message = `${method} ${path} - ${statusCode} (${duration}ms)`;

        if (level === 'WARN') {
            this.warn(service, message, {method, path, statusCode, duration}, context);
        } else {
            this.info(service, message, {method, path, statusCode, duration}, context);
        }
    }

    public performance(service: string, operation: string, duration: number, context?: {
        requestId?: string;
        userId?: string
    }): void {
        const level = duration > 1000 ? 'WARN' : 'DEBUG';
        const message = `Performance: ${operation} took ${duration}ms`;

        if (level === 'WARN') {
            this.warn(service, message, {operation, duration}, context);
        } else {
            this.debug(service, message, {operation, duration}, context);
        }
    }

    public security(service: string, event: string, severity: 'low' | 'medium' | 'high', data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        const message = `Security Event: ${event} (Severity: ${severity})`;

        switch (severity) {
            case 'high':
                this.error(service, message, undefined, data, context);
                break;
            case 'medium':
                this.warn(service, message, data, context);
                break;
            case 'low':
                this.info(service, message, data, context);
                break;
        }
    }

    public close(): void {
        if (this.logStream) {
            this.logStream.end();
        }
    }

    private getLogLevelFromEnv(): LogLevel {
        const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
        switch (envLogLevel) {
            case 'ERROR':
                return LogLevel.ERROR;
            case 'WARN':
                return LogLevel.WARN;
            case 'INFO':
                return LogLevel.INFO;
            case 'DEBUG':
                return LogLevel.DEBUG;
            case 'TRACE':
                return LogLevel.TRACE;
            default:
                return LogLevel.INFO;
        }
    }

    private setupLogDirectory(): void {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, {recursive: true});
        }
    }

    private setupLogStream(): void {
        if (process.env.NODE_ENV !== 'test') {
            const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
            const logFilePath = join(this.logDir, logFileName);
            this.logStream = createWriteStream(logFilePath, {flags: 'a'});
        }
    }

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private formatLogEntry(entry: LogEntry): string {
        const baseLog = `[${entry.timestamp}] [${entry.level}] [${entry.service}] ${entry.message}`;

        let additionalInfo = '';
        if (entry.requestId) additionalInfo += ` | RequestId: ${entry.requestId}`;
        if (entry.userId) additionalInfo += ` | UserId: ${entry.userId}`;
        if (entry.data && typeof entry.data === 'object') {
            additionalInfo += ` | Data: ${JSON.stringify(entry.data)}`;
        }
        if (entry.error) {
            additionalInfo += ` | Error: ${entry.error.message} | Stack: ${entry.error.stack}`;
        }

        return baseLog + additionalInfo;
    }

    private writeLog(entry: LogEntry): void {
        const formattedLog = this.formatLogEntry(entry);

        // Write to console with colors
        this.writeToConsole(entry.level, formattedLog);

        // Write to file if stream is available
        if (this.logStream) {
            this.logStream.write(formattedLog + '\n');
        }
    }

    private writeToConsole(level: string, message: string): void {
        const colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[35m', // Magenta
            TRACE: '\x1b[37m'  // White
        };
        const reset = '\x1b[0m';

        const colorCode = colors[level as keyof typeof colors] || colors.INFO;
        console.log(`${colorCode}${message}${reset}`);
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export service-specific loggers
export const createServiceLogger = (serviceName: string) => {
    return {
        error: (message: string, error?: Error, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.error(serviceName, message, error, data, context),
        warn: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.warn(serviceName, message, data, context),
        info: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.info(serviceName, message, data, context),
        debug: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.debug(serviceName, message, data, context),
        trace: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.trace(serviceName, message, data, context),
        authentication: (success: boolean, identifier: string, context?: { requestId?: string }) =>
            logger.authentication(success, serviceName, identifier, context),
        transaction: (action: string, data: any, context?: { requestId?: string; userId?: string }) =>
            logger.transaction(serviceName, action, data, context),
        performance: (operation: string, duration: number, context?: { requestId?: string; userId?: string }) =>
            logger.performance(serviceName, operation, duration, context),
        security: (event: string, severity: 'low' | 'medium' | 'high', data?: any, context?: {
            requestId?: string;
            userId?: string
        }) =>
            logger.security(serviceName, event, severity, data, context)
    };
};
