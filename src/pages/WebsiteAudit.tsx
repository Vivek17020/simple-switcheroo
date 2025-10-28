import { ComprehensiveAuditReport } from '@/components/audit/comprehensive-audit-report';

export default function WebsiteAudit() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Website Audit Report</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive analysis of security, performance, SEO, accessibility, and code quality
        </p>
      </div>
      
      <ComprehensiveAuditReport />
    </div>
  );
}