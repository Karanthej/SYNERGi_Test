import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background p-6">
          <div className="max-w-md w-full glass-card border rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-destructive/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 relative z-10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground mb-8">
              An unexpected error occurred in the application. Our team has been notified.
            </p>
            
            {/* Developer Error Details (Optional, can be hidden in strict prod) */}
            {this.state.error && (
              <div className="w-full text-left bg-black/5 dark:bg-white/5 rounded-lg p-3 mb-8 overflow-x-auto">
                <p className="text-xs font-mono text-destructive/80 font-medium whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full relative z-10">
              <Button onClick={this.handleReload} className="flex-1 flex items-center gap-2" variant="default">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1 flex items-center gap-2">
                <Home className="w-4 h-4" /> Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
