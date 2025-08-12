import React, {Component, ErrorInfo, ReactNode} from 'react';
import {Card} from './ui/Card';
import {Button} from './ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false, error: null, errorInfo: null};
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            hasError: true,
            error,
            errorInfo
        });

        // Log error to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // You can integrate with error monitoring services here
            console.error('Production error:', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            });
        }
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null, errorInfo: null});
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="p-8 max-w-2xl mx-auto mt-8">
                    <div className="text-center">
                        <div
                            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="text-2xl">⚠️</div>
                        </div>
                        <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-4">
                            An unexpected error occurred while rendering this component.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                                    Error Details (Development Mode)
                                </summary>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs font-medium text-red-700">Error Message:</p>
                                        <code className="text-xs text-red-600 bg-red-100 p-1 rounded">
                                            {this.state.error.message}
                                        </code>
                                    </div>
                                    {this.state.error.stack && (
                                        <div>
                                            <p className="text-xs font-medium text-red-700">Stack Trace:</p>
                                            <pre
                                                className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                                                {this.state.error.stack}
                                            </pre>
                                        </div>
                                    )}
                                    {this.state.errorInfo?.componentStack && (
                                        <div>
                                            <p className="text-xs font-medium text-red-700">Component Stack:</p>
                                            <pre
                                                className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="flex justify-center space-x-3">
                            <Button
                                onClick={this.handleRetry}
                                variant="outline"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleRefresh}
                            >
                                Refresh Page
                            </Button>
                        </div>

                        <div className="mt-6 text-xs text-gray-500">
                            <p>If this error persists, please:</p>
                            <ul className="mt-2 space-y-1">
                                <li>• Check your internet connection</li>
                                <li>• Clear your browser cache</li>
                                <li>• Try using a different browser</li>
                                <li>• Contact support if the issue continues</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for error boundary
export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) => {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
};
