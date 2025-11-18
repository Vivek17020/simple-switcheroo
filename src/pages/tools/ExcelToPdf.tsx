import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, X, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type Orientation = "portrait" | "landscape";

export default function ExcelToPdf() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|xls)$/i)) {
      toast.error("Please select a valid Excel file (.xls or .xlsx)");
      return;
    }

    setExcelFile(file);
    setConvertedBlob(null);
    toast.success("Excel file uploaded successfully");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback(() => {
    setExcelFile(null);
    setConvertedBlob(null);
  }, []);

  const convertToPdf = useCallback(async () => {
    if (!excelFile) {
      toast.error("Please select an Excel file to convert");
      return;
    }

    setIsConverting(true);

    try {
      const arrayBuffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Create PDF with selected orientation
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let isFirstSheet = true;

      // Process each sheet
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Add new page for each sheet except the first one
        if (!isFirstSheet) {
          pdf.addPage();
        }
        isFirstSheet = false;

        // Add sheet name as header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(sheetName, 14, 15);

        // Convert sheet to JSON to get data
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text('(Empty sheet)', 14, 25);
          return;
        }

        // Prepare table data
        const tableData: any[] = [];
        const headers: string[] = [];
        
        jsonData.forEach((row: any, index: number) => {
          if (index === 0) {
            // First row as headers
            headers.push(...row.map((cell: any) => cell !== null && cell !== undefined ? String(cell) : ''));
          } else {
            // Data rows
            tableData.push(row.map((cell: any) => cell !== null && cell !== undefined ? String(cell) : ''));
          }
        });

        // If no data rows, use first row as data
        if (tableData.length === 0 && headers.length > 0) {
          tableData.push(headers);
        }

        // Create table using autoTable
        if (tableData.length > 0) {
          (pdf as any).autoTable({
            head: headers.length > 0 ? [headers] : undefined,
            body: tableData,
            startY: 22,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap',
            },
            headStyles: {
              fillColor: [66, 139, 202],
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 22, right: 14, bottom: 14, left: 14 },
            tableWidth: 'auto',
            columnStyles: {},
            didParseCell: function(data: any) {
              // Adjust column widths based on content
              if (data.section === 'head') {
                data.cell.styles.halign = 'center';
              }
            },
          });
        }
      });

      // Add metadata footer on last page
      const totalPages = (pdf as any).internal.getNumberOfPages();
      pdf.setPage(totalPages);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      const footerText = `Converted from ${excelFile.name} | TheBulletinBriefs.in`;
      pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      setConvertedBlob(pdfBlob);

      toast.success("Excel file converted to PDF successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert Excel file. Please ensure the file is valid.");
    } finally {
      setIsConverting(false);
    }
  }, [excelFile, orientation]);

  const downloadPdf = useCallback(() => {
    if (!convertedBlob || !excelFile) return;

    const url = URL.createObjectURL(convertedBlob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const originalName = excelFile.name.replace(/\.(xlsx?|xls)$/i, '');
    const filename = `${originalName}-${orientation}-${timestamp}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully!");
  }, [convertedBlob, excelFile, orientation]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Does it keep formulas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The PDF will show the calculated values from your formulas, not the formulas themselves. This is standard for PDF conversion as PDFs display static content."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a file-size limit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "There's no strict file size limit, but very large Excel files (over 10MB) may take longer to convert. The tool works best with files under 5MB for optimal performance."
        }
      },
      {
        "@type": "Question",
        "name": "Can I choose orientation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! You can choose between portrait or landscape orientation before converting. Landscape is recommended for wide spreadsheets with many columns."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Excel to PDF Converter Online – Free | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert Excel sheets to PDF quickly. 100% free and secure."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/excel-to-pdf/" />
        
        <meta property="og:title" content="Excel to PDF Converter Online – Free | TheBulletinBriefs" />
        <meta property="og:description" content="Convert Excel sheets to PDF quickly. 100% free and secure." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/excel-to-pdf/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Excel to PDF Converter Online – Free" />
        <meta name="twitter:description" content="Convert Excel sheets to PDF quickly. 100% free and secure." />
        
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/tools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Link>
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Excel to PDF Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Save spreadsheets as PDFs for easy sharing.
            </p>
          </div>

          {/* Main Converter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Select an Excel file (.xls or .xlsx) to convert to PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Orientation Selection */}
              <div className="space-y-3">
                <Label>Page Orientation</Label>
                <RadioGroup
                  value={orientation}
                  onValueChange={(value) => setOrientation(value as Orientation)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait" className="cursor-pointer">
                      Portrait (Vertical)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="cursor-pointer">
                      Landscape (Horizontal)
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Choose landscape for wide spreadsheets with many columns
                </p>
              </div>

              {/* Drop Zone */}
              {!excelFile && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Drop Excel file here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload a .xls or .xlsx file to convert to PDF
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              )}

              {/* Excel File Preview */}
              {excelFile && !convertedBlob && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {excelFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Size: {formatFileSize(excelFile.size)} | Orientation: {orientation}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={convertToPdf}
                    disabled={isConverting}
                    className="w-full"
                    size="lg"
                  >
                    <FileSpreadsheet className="mr-2 h-5 w-5" />
                    {isConverting ? "Converting..." : "Convert to PDF"}
                  </Button>
                </div>
              )}

              {/* Conversion Results */}
              {convertedBlob && excelFile && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <FileSpreadsheet className="h-5 w-5" />
                      <span className="text-sm font-medium">Conversion Complete!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your PDF is ready to download in {orientation} orientation.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={downloadPdf}
                      className="flex-1"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={removeFile}
                      variant="outline"
                      size="lg"
                    >
                      Convert Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grid Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Preserves table structure and cell formatting.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Converts all sheets in your workbook to PDF pages.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Orientation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose portrait or landscape for optimal viewing.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">100% Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All processing in browser. Files never uploaded.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Convert Excel to PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose Orientation</h3>
                  <p className="text-sm text-muted-foreground">
                    Select portrait or landscape based on your spreadsheet layout.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Excel File</h3>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop your .xls or .xlsx file into the upload area.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Convert & Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Convert to PDF" and download your professionally formatted PDF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Does it keep formulas?</h3>
                <p className="text-muted-foreground">
                  The PDF will show the calculated values from your formulas, not the formulas themselves. This is standard for PDF conversion as PDFs display static content.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Is there a file-size limit?</h3>
                <p className="text-muted-foreground">
                  There's no strict file size limit, but very large Excel files (over 10MB) may take longer to convert. The tool works best with files under 5MB for optimal performance.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Can I choose orientation?</h3>
                <p className="text-muted-foreground">
                  Yes! You can choose between portrait or landscape orientation before converting. Landscape is recommended for wide spreadsheets with many columns.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
