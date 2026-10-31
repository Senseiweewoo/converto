'use client';

export interface NetworkAuditLog {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  bytesUploaded: number;
  status: 'allowed-local' | 'network-call';
}

class PrivacyProofTracker {
  private logs: NetworkAuditLog[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Observe resource timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const res = entry as PerformanceResourceTiming;
              this.recordLog({
                id: Math.random().toString(36).substring(2, 9),
                timestamp: Date.now(),
                url: res.name,
                method: 'GET',
                bytesUploaded: 0,
                status: 'network-call',
              });
            }
          }
        });
        observer.observe({ entryTypes: ['resource'] });
      } catch {
        // fallback
      }
    }
  }

  public recordLog(log: NetworkAuditLog) {
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  }

  public getLogs(): NetworkAuditLog[] {
    return [...this.logs];
  }

  public getTotalBytesUploaded(): number {
    return this.logs.reduce((acc, log) => acc + log.bytesUploaded, 0);
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const privacyProofTracker = new PrivacyProofTracker();
