import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface CertificateData {
  userName: string;
  learningPathTitle: string;
  completedDate: string;
  certificateNumber: string;
  verificationCode: string;
  totalArticles: number;
  totalPoints: number;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles)
  pdf.setFillColor(106, 91, 255);
  pdf.rect(0, 0, width, height, "F");
  
  // Decorative circles with transparency
  pdf.setFillColor(74, 196, 255);
  pdf.setGState({ opacity: 0.3 } as any);
  pdf.circle(width - 50, 50, 80, "F");
  pdf.circle(50, height - 50, 60, "F");
  
  pdf.setGState({ opacity: 1 } as any);

  // White background for content
  const margin = 15;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, margin, width - margin * 2, height - margin * 2, 5, 5, "F");

  // Border decoration
  pdf.setDrawColor(106, 91, 255);
  pdf.setLineWidth(1);
  pdf.roundedRect(margin + 5, margin + 5, width - margin * 2 - 10, height - margin * 2 - 10, 3, 3, "S");

  // Title
  pdf.setTextColor(106, 91, 255);
  pdf.setFontSize(36);
  pdf.setFont("helvetica", "bold");
  pdf.text("Certificate of Completion", width / 2, 45, { align: "center" });

  // Subtitle
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Web3 for India Learning Platform", width / 2, 55, { align: "center" });

  // Decorative line
  pdf.setDrawColor(74, 196, 255);
  pdf.setLineWidth(0.5);
  pdf.line(width / 2 - 50, 60, width / 2 + 50, 60);

  // Main content
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.text("This is to certify that", width / 2, 75, { align: "center" });

  // User name
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(106, 91, 255);
  pdf.text(data.userName, width / 2, 90, { align: "center" });

  // Achievement description
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  pdf.text("has successfully completed the learning path", width / 2, 105, { align: "center" });

  // Learning path title
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(74, 196, 255);
  pdf.text(data.learningPathTitle, width / 2, 120, { align: "center" });

  // Stats
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `${data.totalArticles} Articles Completed • ${data.totalPoints} Points Earned`,
    width / 2,
    130,
    { align: "center" }
  );

  // Date
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Completed on: ${data.completedDate}`, width / 2, 145, { align: "center" });

  // Certificate number
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Certificate No: ${data.certificateNumber}`, width / 2, 155, { align: "center" });

  // QR Code for verification
  try {
    const verificationUrl = `https://www.thebulletinbriefs.in/web3forindia/verify/${data.verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: "#6A5BFF",
        light: "#FFFFFF",
      },
    });

    // Add QR code
    const qrSize = 25;
    pdf.addImage(qrDataUrl, "PNG", width - 45, height - 45, qrSize, qrSize);

    // QR label
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Scan to verify", width - 32.5, height - 15, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Signature line (decorative)
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.3);
  pdf.line(40, height - 35, 100, height - 35);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Authorized Signature", 70, height - 30, { align: "center" });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    "TheBulletinBriefs • Web3 for India • www.thebulletinbriefs.in",
    width / 2,
    height - 10,
    { align: "center" }
  );

  return pdf.output("blob");
}

export function downloadCertificate(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function shareOnLinkedIn(certificateData: CertificateData) {
  const title = `Certificate of Completion - ${certificateData.learningPathTitle}`;
  const description = `I've successfully completed the ${certificateData.learningPathTitle} learning path on Web3 for India! 🎉 ${certificateData.totalArticles} articles completed, ${certificateData.totalPoints} points earned.`;
  const url = `https://www.thebulletinbriefs.in/web3forindia/verify/${certificateData.verificationCode}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  window.open(linkedInUrl, "_blank", "width=600,height=600");
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `WEB3-${timestamp}-${random}`;
}

export function generateVerificationCode(): string {
  return `${Math.random().toString(36).substring(2, 15)}${Math.random()
    .toString(36)
    .substring(2, 15)}`;
}
