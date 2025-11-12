import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet, FileImage, Presentation, Scissors, Merge, FileDown } from "lucide-react";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Helmet } from "react-helmet-async";

const pdfTools = [
  {
    title: "PDF to Word",
    description: "Convert PDF documents to editable Word files",
    url: "/tools/pdf-to-word",
    icon: FileText
  },
  {
    title: "Word to PDF",
    description: "Convert Word documents to PDF format",
    url: "/tools/word-to-pdf",
    icon: FileText
  },
  {
    title: "PDF to Excel",
    description: "Extract tables from PDF to Excel spreadsheets",
    url: "/tools/pdf-to-excel",
    icon: FileSpreadsheet
  },
  {
    title: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF documents",
    url: "/tools/excel-to-pdf",
    icon: FileSpreadsheet
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages to JPG images",
    url: "/tools/pdf-to-jpg",
    icon: FileImage
  },
  {
    title: "JPG to PDF",
    description: "Convert JPG images to PDF documents",
    url: "/tools/jpg-to-pdf",
    icon: FileImage
  },
  {
    title: "PDF to PowerPoint",
    description: "Convert PDF to editable PowerPoint presentations",
    url: "/tools/pdf-to-ppt",
    icon: Presentation
  },
  {
    title: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations to PDF",
    url: "/tools/ppt-to-pdf",
    icon: Presentation
  },
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one",
    url: "/tools/merge-pdf",
    icon: Merge
  },
  {
    title: "Split PDF",
    description: "Split PDF into separate pages or sections",
    url: "/tools/split-pdf",
    icon: Scissors
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality",
    url: "/tools/compress-pdf",
    icon: FileDown
  }
];

export default function PdfTools() {
  const canonicalUrl = `${window.location.origin}/tools/pdf-tools`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "PDF Tools",
    "description": "Complete collection of free PDF conversion and editing tools",
    "numberOfItems": pdfTools.length,
    "itemListElement": pdfTools.map((tool, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": tool.title,
      "description": tool.description,
      "url": `${window.location.origin}${tool.url}`
    }))
  };

  return (
    <>
      <AdvancedSEOHead
        title="Free PDF Tools – Convert, Edit & Manage PDFs | TheBulletinBriefs"
        description="Complete collection of free PDF tools. Convert, merge, split, compress PDFs online. Fast, secure, and no signup required."
        canonical={canonicalUrl}
        tags={["pdf tools", "pdf converter", "merge pdf", "split pdf", "compress pdf", "pdf editor"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: canonicalUrl }
        ]}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(itemListSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools" }
          ]}
        />

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Free PDF Tools</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive collection of free online PDF tools. Convert, edit, merge, split, and compress PDF files with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link key={index} to={tool.url}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Why Use Our PDF Tools?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">🚀 Fast Processing</h3>
                <p className="text-muted-foreground">
                  Client-side processing means instant conversions without uploading to servers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔒 100% Secure</h3>
                <p className="text-muted-foreground">
                  Your files never leave your device. All processing happens in your browser.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">💯 Completely Free</h3>
                <p className="text-muted-foreground">
                  No subscriptions, no hidden fees. Use all tools unlimited times for free.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📱 Mobile Friendly</h3>
                <p className="text-muted-foreground">
                  Works perfectly on all devices - desktop, tablet, and mobile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
