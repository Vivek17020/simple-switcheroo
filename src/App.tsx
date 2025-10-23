import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { CSPHeaders } from "@/components/security/csp-headers";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { OptimizedCoreWebVitals } from "@/components/performance/optimized-core-web-vitals";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { useAutoTranslate } from "@/hooks/use-auto-translate";

// Lazy load all pages for better performance
const NewsHomepage = lazy(() => import("./pages/NewsHomepage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const RSSFeed = lazy(() => import("./pages/RSSFeed"));
const SitemapXML = lazy(() => import("./pages/SitemapXML"));
const NewsSitemapXML = lazy(() => import("./pages/NewsSitemapXML"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const EditorialGuidelines = lazy(() => import("./pages/EditorialGuidelines"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/SubscriptionCanceled"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminArticles = lazy(() => import("./pages/AdminArticles"));
const AdminNewArticle = lazy(() => import("./pages/AdminNewArticle"));
const AdminEditArticle = lazy(() => import("./pages/AdminEditArticle"));
const AdminEngagement = lazy(() => import("./pages/AdminEngagement"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminExams = lazy(() => import("./pages/AdminExams"));
const NewsletterPreferencesPage = lazy(() => import("./pages/NewsletterPreferences"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const WebsiteAudit = lazy(() => import("./pages/WebsiteAudit"));
const AuditReport = lazy(() => import("./pages/AuditReport"));
const GovernmentExams = lazy(() => import("@/pages/GovernmentExams"));
const GovernmentExamPapers = lazy(() => import("@/pages/GovernmentExamPapers"));
const AdminExamPapers = lazy(() => import("@/pages/AdminExamPapers"));
const PreviousYearPapers = lazy(() => import("@/pages/PreviousYearPapers"));
const ExamPaperDetail = lazy(() => import("@/pages/ExamPaperDetail"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const AdmitCards = lazy(() => import("@/pages/AdmitCards"));
const AdminAdmitCards = lazy(() => import("@/pages/AdminAdmitCards"));
const AdminNewAdmitCard = lazy(() => import("@/pages/AdminNewAdmitCard"));

const GlobalTranslator: React.FC = () => {
  useAutoTranslate();
  return null;
};

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <TranslationProvider>
            <TooltipProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <CSPHeaders />
                  <OptimizedCoreWebVitals />
                  <Toaster />
                  <Sonner />
                  <GlobalTranslator />
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<NewsHomepage />} />
                    <Route path="/article/:slug" element={<ArticlePage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/:parentSlug/:childSlug" element={<CategoryPage />} />
                    <Route path="/rss" element={<RSSFeed />} />
                    <Route path="/sitemap.xml" element={<SitemapXML />} />
                    <Route path="/news-sitemap.xml" element={<NewsSitemapXML />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                    <Route path="/subscription-canceled" element={<SubscriptionCanceled />} />
                    <Route path="/editorial-guidelines" element={<EditorialGuidelines />} />
                    <Route path="/newsletter-preferences" element={<NewsletterPreferencesPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />
                    <Route path="/audit" element={<WebsiteAudit />} />
                    <Route path="/auth" element={<Auth />} />
          <Route path="/government-exams" element={<GovernmentExams />} />
          <Route path="/government-exams/:slug" element={<GovernmentExamPapers />} />
          <Route path="/jobs/previous-year-papers" element={<PreviousYearPapers />} />
          <Route path="/jobs/previous-year-papers/:slug" element={<ExamPaperDetail />} />
          <Route path="/admit-cards" element={<AdmitCards />} />
          <Route path="/jobs/results" element={<ComingSoon title="Results" />} />
          <Route path="/jobs/syllabus" element={<ComingSoon title="Syllabus" />} />
          <Route path="/admin/pyq" element={<AdminExamPapers />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="articles" element={<AdminArticles />} />
                      <Route path="articles/new" element={<AdminNewArticle />} />
                      <Route path="articles/:id/edit" element={<AdminEditArticle />} />
                      <Route path="engagement" element={<AdminEngagement />} />
                      <Route path="audit-report" element={<AuditReport />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="exams" element={<AdminExams />} />
                      <Route path="exam-papers" element={<AdminExamPapers />} />
                      <Route path="upload-pyqs" element={<AdminExamPapers />} />
                      <Route path="admit-cards" element={<AdminAdmitCards />} />
                      <Route path="admit-cards/new" element={<AdminNewAdmitCard />} />
                    </Route>
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
          </TranslationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
