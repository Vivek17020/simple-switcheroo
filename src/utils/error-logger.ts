interface ErrorLogEntry {
  message: string;
  stack?: string;
  url: string;
  timestamp: Date;
  userAgent: string;
  userId?: string;
  level: 'error' | 'warn' | 'info';
  context?: Record<string, any>;
}

class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private maxErrors = 100;

  log(error: Error | string, level: 'error' | 'warn' | 'info' = 'error', context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      url: window.location.href,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      level,
      context
    };

    this.errors.unshift(entry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Console logging
    if (level === 'error') {
      console.error(entry.message, entry);
    } else if (level === 'warn') {
      console.warn(entry.message, entry);
    } else {
      console.log(entry.message, entry);
    }

    // Send to analytics if available
    if ((window as any).gtag && level === 'error') {
      (window as any).gtag('event', 'exception', {
        description: entry.message,
        fatal: false
      });
    }
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  async exportErrors() {
    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'URL', 'User Agent'],
      ...this.errors.map(error => [
        error.timestamp.toISOString(),
        error.level,
        error.message,
        error.url,
        error.userAgent
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const errorLogger = new ErrorLogger();

// Global error handlers
window.addEventListener('error', (event) => {
  errorLogger.log(event.error || event.message, 'error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorLogger.log(`Unhandled Promise Rejection: ${event.reason}`, 'error');
});
