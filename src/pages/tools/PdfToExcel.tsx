import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { FileText, FileImage, Presentation } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const canonicalUrl = `${window.location.origin}/tools/pdf-to-excel`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully!");
    } else {
      toast.error("Please upload a valid PDF file");
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setIsConverting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const allRows: any[][] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageData: { [key: number]: string[] } = {};
        
        textContent.items.forEach((item: any) => {
          const y = Math.round(item.transform[5]);
          if (!pageData[y]) {
            pageData[y] = [];
          }
          pageData[y].push(item.str);
        });

        const sortedRows = Object.keys(pageData)
          .map(Number)
          .sort((a, b) => b - a);

        sortedRows.forEach(y => {
          allRows.push(pageData[y]);
        });
      }

      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      XLSX.writeFile(workbook, `${file.name.replace(/\.pdf$/i, "")}.xlsx`);
      toast.success("Excel file created successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const relatedTools = [
    {
      title: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF format",
      url: "/tools/excel-to-pdf",
      icon: FileSpreadsheet
    },
    {
      title: "PDF to Word",
      description: "Convert PDF documents to Word format",
      url: "/tools/pdf-to-word",
      icon: FileText
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to JPG images",
      url: "/tools/pdf-to-jpg",
      icon: FileImage
    }
  ];

  return (
    <>
      <AdvancedSEOHead
        title="PDF to Excel Converter – Extract Tables Online | TheBulletinBriefs"
        description="Convert PDF tables to Excel online. Fast, accurate, and free. Extract and edit tables from PDF documents easily."
        canonical={canonicalUrl}
        tags={["pdf to excel", "extract pdf tables", "pdf converter", "pdf to xlsx", "convert pdf"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <SoftwareApplicationSchema
        name="PDF to Excel Converter"
        description="Extract tables from PDF and convert to Excel format online for free"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: `${window.location.origin}/tools/pdf-tools` },
          { name: "PDF to Excel", url: canonicalUrl }
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools", url: "/tools/pdf-tools" },
            { label: "PDF to Excel" }
          ]}
        />

        <h1 className="text-4xl font-bold mb-4">Free PDF to Excel Converter</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Extract and edit tables from PDF documents easily. Convert PDF to Excel with preserved numeric data and columns.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload PDF File
            </CardTitle>
            <CardDescription>
              Extract tables and convert to Excel format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF files only
                </p>
              </label>
            </div>

            {file && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className="w-full"
              size="lg"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Convert to Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Does it work for scanned PDFs?</h3>
              <p className="text-muted-foreground">
                This tool works best with native PDF files containing selectable text. Scanned PDFs require OCR processing for accurate conversion.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Will formatting stay the same?</h3>
              <p className="text-muted-foreground">
                The tool preserves text content and basic table structure. Complex formatting and styling may require manual adjustment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there any limit?</h3>
              <p className="text-muted-foreground">
                No file size limits, but very large PDFs may take longer to process. All conversion happens in your browser for privacy.
              </p>
            </div>
          </CardContent>
        </Card>

        <RelatedTools tools={relatedTools} />
      </div>
    </>
  );
}
