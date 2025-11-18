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
import { TranslationLoader } from "@/components/public/translation-loader";


// Lazy load all pages for better performance
const NewsHomepage = lazy(() => import("./pages/NewsHomepage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const RSSFeed = lazy(() => import("./pages/RSSFeed"));
const SitemapXML = lazy(() => import("./pages/SitemapXML"));
const NewsSitemapXML = lazy(() => import("./pages/NewsSitemapXML"));
const ToolsSitemapXML = lazy(() => import("./pages/ToolsSitemapXML"));
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
const Tools = lazy(() => import("./pages/Tools"));
const VideoTools = lazy(() => import("./pages/tools/VideoTools"));
const PdfTools = lazy(() => import("./pages/tools/PdfTools"));
const ImageTools = lazy(() => import("./pages/tools/ImageTools"));
const AdminExamPapers = lazy(() => import("@/pages/AdminExamPapers"));
const PreviousYearPapers = lazy(() => import("@/pages/PreviousYearPapers"));
const ExamPaperDetail = lazy(() => import("@/pages/ExamPaperDetail"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const AdmitCards = lazy(() => import("@/pages/AdmitCards"));
const AdminAdmitCards = lazy(() => import("@/pages/AdminAdmitCards"));
const AdminNewAdmitCard = lazy(() => import("@/pages/AdminNewAdmitCard"));
const AdminCricketMatches = lazy(() => import("@/pages/AdminCricketMatches"));
const AdminVideos = lazy(() => import("@/pages/AdminVideos"));
const AdminWebStories = lazy(() => import("@/pages/AdminWebStories"));
const AdminNewWebStory = lazy(() => import("@/pages/AdminNewWebStory"));
const AdminEditWebStory = lazy(() => import("@/pages/AdminEditWebStory"));
const WebStoryIndex = lazy(() => import("@/pages/WebStoryIndex"));
const WebStoryPage = lazy(() => import("@/pages/WebStoryPage"));
const WebStoryPreview = lazy(() => import("@/pages/WebStoryPreview"));
const JpgToPdf = lazy(() => import("@/pages/tools/JpgToPdf"));
const YoutubeShortsDownloader = lazy(() => import("@/pages/tools/YoutubeShortsDownloader"));
const MergePdf = lazy(() => import("@/pages/tools/MergePdf"));
const SplitPdf = lazy(() => import("@/pages/tools/SplitPdf"));
const CompressPdf = lazy(() => import("@/pages/tools/CompressPdf"));
const PdfToWord = lazy(() => import("@/pages/tools/PdfToWord"));
const WordToPdf = lazy(() => import("@/pages/tools/WordToPdf"));
const ExcelToPdf = lazy(() => import("@/pages/tools/ExcelToPdf"));
const JpgToPng = lazy(() => import("@/pages/tools/JpgToPng"));
const PngToJpg = lazy(() => import("@/pages/tools/PngToJpg"));
const ImageCompressor = lazy(() => import("@/pages/tools/ImageCompressor"));
const ImageResizer = lazy(() => import("@/pages/tools/ImageResizer"));
const ImageCropper = lazy(() => import("@/pages/tools/ImageCropper"));
const ConvertToWebp = lazy(() => import("@/pages/tools/ConvertToWebp"));
const PdfToExcel = lazy(() => import("@/pages/tools/PdfToExcel"));
const PdfToPpt = lazy(() => import("@/pages/tools/PdfToPpt"));
const PptToPdf = lazy(() => import("@/pages/tools/PptToPdf"));
const PdfToJpg = lazy(() => import("@/pages/tools/PdfToJpg"));
const InstagramVideoDownloader = lazy(() => import("@/pages/tools/InstagramVideoDownloader"));
const PdfWatermark = lazy(() => import("@/pages/tools/PdfWatermark"));
const ToolsAuditReport = lazy(() => import("@/pages/ToolsAuditReport"));
const AdminIndexingDashboard = lazy(() => import("@/pages/AdminIndexingDashboard"));
const AdminSEOAudit = lazy(() => import("@/pages/AdminSEOAudit"));

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TranslationProvider>
            <TooltipProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <CSPHeaders />
                  <OptimizedCoreWebVitals />
                  <TranslationLoader />
                  <Toaster />
                  <Sonner />
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
                    <Route path="/sitemap-tools.xml" element={<ToolsSitemapXML />} />
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
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/video-tools" element={<VideoTools />} />
          <Route path="/tools/pdf-tools" element={<PdfTools />} />
          <Route path="/tools/image-tools" element={<ImageTools />} />
          <Route path="/tools/jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="/tools/youtube-shorts-downloader" element={<YoutubeShortsDownloader />} />
          <Route path="/tools/merge-pdf" element={<MergePdf />} />
          <Route path="/tools/split-pdf" element={<SplitPdf />} />
          <Route path="/tools/compress-pdf" element={<CompressPdf />} />
          <Route path="/tools/pdf-to-word" element={<PdfToWord />} />
          <Route path="/tools/word-to-pdf" element={<WordToPdf />} />
          <Route path="/tools/excel-to-pdf" element={<ExcelToPdf />} />
          <Route path="/tools/jpg-to-png" element={<JpgToPng />} />
          <Route path="/tools/png-to-jpg" element={<PngToJpg />} />
          <Route path="/tools/image-compressor" element={<ImageCompressor />} />
          <Route path="/tools/image-resizer" element={<ImageResizer />} />
          <Route path="/tools/image-cropper" element={<ImageCropper />} />
          <Route path="/tools/convert-to-webp" element={<ConvertToWebp />} />
          <Route path="/tools/pdf-to-excel" element={<PdfToExcel />} />
          <Route path="/tools/pdf-to-ppt" element={<PdfToPpt />} />
          <Route path="/tools/ppt-to-pdf" element={<PptToPdf />} />
          <Route path="/tools/pdf-to-jpg" element={<PdfToJpg />} />
          <Route path="/tools/instagram-video-downloader" element={<InstagramVideoDownloader />} />
          <Route path="/tools/pdf-watermark" element={<PdfWatermark />} />
          <Route path="/tools-audit-report" element={<ToolsAuditReport />} />
          <Route path="/government-exams" element={<GovernmentExams />} />
          <Route path="/government-exams/:slug" element={<GovernmentExamPapers />} />
          <Route path="/jobs/previous-year-papers" element={<PreviousYearPapers />} />
          <Route path="/jobs/previous-year-papers/:slug" element={<ExamPaperDetail />} />
          <Route path="/admit-cards" element={<AdmitCards />} />
          <Route path="/jobs/results" element={<ComingSoon title="Results" />} />
          <Route path="/jobs/syllabus" element={<ComingSoon title="Syllabus" />} />
          <Route path="/admin/pyq" element={<AdminExamPapers />} />
          <Route path="/web-stories" element={<WebStoryIndex />} />
          <Route path="/webstories/:category/:slug" element={<WebStoryPage />} />
          <Route path="/web-stories/:slug" element={<WebStoryPage />} /> {/* Legacy support */}
          <Route path="/admin/web-stories/preview/:slug" element={<WebStoryPreview />} />
                    
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
                      <Route path="cricket-matches" element={<AdminCricketMatches />} />
                      <Route path="videos" element={<AdminVideos />} />
                      <Route path="web-stories" element={<AdminWebStories />} />
                      <Route path="web-stories/new" element={<AdminNewWebStory />} />
                      <Route path="web-stories/:id/edit" element={<AdminEditWebStory />} />
                      <Route path="indexing" element={<AdminIndexingDashboard />} />
                      <Route path="seo-audit" element={<AdminSEOAudit />} />
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
