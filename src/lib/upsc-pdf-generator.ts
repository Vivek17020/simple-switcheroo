import jsPDF from 'jspdf';

interface ArticleData {
  title: string;
  content: string;
  category_name: string;
  created_at: string;
  reading_time?: number;
}

export const generateUPSCArticlePDF = (article: ArticleData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper to strip HTML and decode entities
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Header
  doc.setFillColor(26, 54, 93); // Dark blue
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('UPSCBriefs', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${article.category_name} | ${new Date(article.created_at).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 25);

  yPosition = 45;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  const titleLines = doc.splitTextToSize(article.title, contentWidth);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8 + 10;

  // Reading time
  if (article.reading_time) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Reading time: ${article.reading_time} minutes`, margin, yPosition);
    yPosition += 10;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Process content
  const content = stripHtml(article.content);
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // Check if it's a heading (all caps or starts with common UPSC headings)
    const isHeading = /^(UPSC Notes|Key Points|Context|Background|Main Explanation|Mains Answer|Prelims MCQs|PYQ Mapping|Conclusion)/i.test(trimmedPara);
    
    if (isHeading) {
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(26, 54, 93);
      const headingLines = doc.splitTextToSize(trimmedPara, contentWidth);
      doc.text(headingLines, margin, yPosition);
      yPosition += headingLines.length * 6 + 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
    } else if (trimmedPara.startsWith('•') || trimmedPara.startsWith('-')) {
      // Bullet points
      const bulletLines = doc.splitTextToSize(trimmedPara, contentWidth - 5);
      checkNewPage(bulletLines.length * 5 + 3);
      doc.text(bulletLines, margin + 5, yPosition);
      yPosition += bulletLines.length * 5 + 3;
    } else {
      // Regular paragraph
      const lines = doc.splitTextToSize(trimmedPara, contentWidth);
      checkNewPage(lines.length * 5 + 6);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 6;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated from UPSCBriefs | www.thebulletinbriefs.in/upscbriefs | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const safeTitle = article.title
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  doc.save(`UPSC-${safeTitle}.pdf`);
};
