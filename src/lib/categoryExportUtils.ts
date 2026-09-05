import type { ComplianceItem } from '@/data/complianceData';

export function exportCategoryToXlsx(category: string, items: ComplianceItem[]) {
  import('xlsx').then((XLSX) => {
    const wsData = [
      ['#', 'Filing Name', 'Category', 'Nature', 'Status', 'Risk Level', 'Due Date', 'Regulation', 'Frequency', 'Filing Authority', 'Applicable To', 'Tier'],
      ...items.map(item => [
        item.sNo,
        item.filingName,
        item.category,
        item.complianceNature,
        item.status,
        item.riskLevel,
        item.dueDate,
        item.regReference,
        item.frequency,
        item.filingAuthority,
        item.applicableTo,
        item.obligorTier,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 45 }, { wch: 25 }, { wch: 8 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, category.slice(0, 31));
    const fileName = `${category.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}_Compliance.xlsx`;
    XLSX.writeFile(wb, fileName);
  });
}

export function exportCategoryToPptx(category: string, items: ComplianceItem[]) {
  import('pptxgenjs').then((PptxGenJS) => {
    const pptx = new PptxGenJS.default();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'deriskadvisory';
    pptx.title = `${category} — Compliance Register`;

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '1B2A4A' };
    titleSlide.addText('deriskadvisory', {
      x: 0.5, y: 0.4, w: 12.3, h: 0.5,
      fontSize: 14, color: '8EBBDC', fontFace: 'Arial',
    });
    titleSlide.addText(category, {
      x: 0.5, y: 1.8, w: 12.3, h: 1.2,
      fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Arial',
    });
    titleSlide.addText(`${items.length} Compliance Items`, {
      x: 0.5, y: 3.2, w: 12.3, h: 0.6,
      fontSize: 18, color: 'AABBCC', fontFace: 'Arial',
    });
    titleSlide.addText(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
      x: 0.5, y: 6.5, w: 12.3, h: 0.4,
      fontSize: 10, color: '667788', fontFace: 'Arial',
    });

    // Data slides — 8 items per slide
    const perSlide = 8;
    const totalSlides = Math.ceil(items.length / perSlide);

    for (let s = 0; s < totalSlides; s++) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      // Header bar
      slide.addShape('rect' as any, {
        x: 0, y: 0, w: 13.33, h: 0.7,
        fill: { color: '1B2A4A' },
      });
      slide.addText(`${category} — Page ${s + 1} of ${totalSlides}`, {
        x: 0.5, y: 0.1, w: 12, h: 0.5,
        fontSize: 12, bold: true, color: 'FFFFFF', fontFace: 'Arial',
      });

      const pageItems = items.slice(s * perSlide, (s + 1) * perSlide);

      // Table
      const headerRow = [
        { text: '#', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' }, align: 'center' as const } },
        { text: 'Filing Name', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' } } },
        { text: 'Nature', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' }, align: 'center' as const } },
        { text: 'Status', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' }, align: 'center' as const } },
        { text: 'Risk', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' }, align: 'center' as const } },
        { text: 'Due Date', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' }, align: 'center' as const } },
        { text: 'Regulation', options: { bold: true, fontSize: 9, color: 'FFFFFF', fill: { color: '1B2A4A' } } },
      ];

      const statusColor = (st: string) => {
        if (st === 'Completed') return '27AE60';
        if (st === 'Overdue') return 'E74C3C';
        if (st === 'Due Soon') return 'F39C12';
        if (st === 'In Progress') return '3498DB';
        return '95A5A6';
      };

      const riskColor = (r: string) => {
        if (r === 'Critical') return 'E74C3C';
        if (r === 'High') return 'F39C12';
        if (r === 'Medium') return '3498DB';
        return '27AE60';
      };

      const dataRows = pageItems.map((item, idx) => {
        const bgColor = idx % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
        return [
          { text: String(item.sNo), options: { fontSize: 8, align: 'center' as const, fill: { color: bgColor } } },
          { text: item.filingName, options: { fontSize: 8, fill: { color: bgColor } } },
          { text: item.complianceNature, options: { fontSize: 8, align: 'center' as const, fill: { color: bgColor } } },
          { text: item.status, options: { fontSize: 8, align: 'center' as const, color: statusColor(item.status), bold: true, fill: { color: bgColor } } },
          { text: item.riskLevel, options: { fontSize: 8, align: 'center' as const, color: riskColor(item.riskLevel), bold: true, fill: { color: bgColor } } },
          { text: item.dueDate, options: { fontSize: 8, align: 'center' as const, fill: { color: bgColor } } },
          { text: item.regReference, options: { fontSize: 7, fill: { color: bgColor } } },
        ];
      });

      slide.addTable([headerRow, ...dataRows], {
        x: 0.3, y: 1.0, w: 12.7,
        colW: [0.5, 4.0, 0.8, 1.2, 0.9, 1.2, 4.1],
        border: { type: 'solid', pt: 0.5, color: 'DEE2E6' },
        margin: [4, 6, 4, 6],
      });

      // Footer
      slide.addText('deriskadvisory', {
        x: 0.5, y: 7.0, w: 6, h: 0.3,
        fontSize: 8, color: '999999', fontFace: 'Arial',
      });
    }

    const fileName = `${category.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}_Compliance.pptx`;
    pptx.writeFile({ fileName });
  });
}
