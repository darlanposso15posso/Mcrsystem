import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceRecord, Client } from '../types';
import { MANDATORY_PRE_CLEANING_CHECKLIST } from './preCleaningChecklist';
import { calculateDuration, formatDate, formatTime, formatDateTime } from './timeUtils';

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Direct fetch failed for logo:", error);
    return null;
  }
};

/**
 * Redimensiona e corta a imagem para preencher o espaço mantendo a proporção (Center Crop)
 */
const centerCropImage = (base64: string, targetWidth: number, targetHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth * 2; // Qualidade dobrada para retina/pdf
      canvas.height = targetHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      const imgAspect = img.width / img.height;
      const targetAspect = canvas.width / canvas.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > targetAspect) {
        // Imagem mais larga que o alvo
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        offsetX = -(drawWidth - canvas.width) / 2;
        offsetY = 0;
      } else {
        // Imagem mais alta que o alvo
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        offsetX = 0;
        offsetY = -(drawHeight - canvas.height) / 2;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

/**
 * Redimensiona a imagem para caber no espaço mantendo a proporção (Fit to Box)
 */
const normalizeLogo = (base64: string, targetWidth: number, targetHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth, drawHeight;

      if (imgAspect > targetAspect) {
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspect;
      } else {
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspect;
      }

      // We use the actual drawn dimensions for the canvas to avoid white borders if unwanted,
      // OR we use the target dimensions and center the logo.
      // For PDF headers, centered in a fixed box is often better.
      canvas.width = targetWidth * 2;
      canvas.height = targetHeight * 2;

      ctx.fillStyle = 'rgba(255,255,255,0)'; // Transparent background if possible, but JPEG will make it white
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const x = (canvas.width - drawWidth * 2) / 2;
      const y = (canvas.height - drawHeight * 2) / 2;

      ctx.drawImage(img, x, y, drawWidth * 2, drawHeight * 2);

      // If the source is PNG and we want to preserve transparency, we use image/png
      const isPng = base64.includes('image/png');
      resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

const LABEL_MAPPING: Record<string, string> = {
  // Pre-Cleaning Mandatory Verification (New IDs)
  "v_kitchen_off": "Kitchen out of Operation",
  "v_electrical_off": "Exhaust Electrical System Off",
  "v_gas_off": "Gas System Off (Lockout/Tagout)",
  "v_fire_supp_prot": "Fire Suppression Protected",
  "v_work_area_safe": "Work Area Isolated & Safe",
  "v_equip_covered": "Kitchen Equipment Plastic Protected",
  "v_drainage_ready": "Drainage Ready for Grease/Water",
  "v_filters_removed": "Hood Filters Removed",
  "v_plenum_inspected": "Plenum Visual Inspection",
  "v_duct_verified": "Ducts & Access Panels Verified",
  "v_roof_fan_inspected": "Roof Fan Base & Base Inspected",
  "v_roof_access_safe": "Roof Access & Ladder Security",
  "v_ppe_used": "Technician Personal Protection (PPE)",

  // Optional Hood Condition
  "opt_hood_grease": "Excessive Grease Identified",
  "opt_hood_corrosion": "Internal Hood Corrosion",
  "opt_hood_welds": "Damaged Welds/Joints",
  "opt_hood_deep_clean": "Deep Cleaning Performed",

  // Optional Fan Condition
  "opt_fan_vibration": "Abnormal Fan Vibration",
  "opt_fan_noise": "Excessive Fan Noise",
  "opt_fan_belt": "Worn Fan Belt",
  "opt_fan_struct": "Fan Structure Problem",
  "opt_fan_fire_risk": "Future Fire Risk Detected",
  "opt_fan_repair": "Structural Repair Needed",
  "opt_fan_new": "New Fan Installation Needed",
  "opt_fan_maintenance": "Immediate General Maintenance",

  // Optional Duct Condition
  "duct_grease_leak": "Grease Leak at Joints",
  "duct_needs_panel": "New Access Panel Needed",
  "duct_obstruction": "Partial Duct Obstruction",

  // Post Cleaning
  "polished": "Polished & Shined",
  "floorsCleaned": "Floors Left Clean",
  "filtersInstalled": "Filters Reinstalled",
  "systemTested": "System Operation Tested",
  "stickersApplied": "Certification Sticker"
};

const formatChecklistKey = (key: string) => {
  if (LABEL_MAPPING[key]) return LABEL_MAPPING[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
};

const parseJSON = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data || {};
};

const parsePhotoArray = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(data) ? data : [];
};

export const generatePDF = async (service: ServiceRecord, client?: Client, logoUrlOverride?: string) => {
  try {
    const doc = new jsPDF();
    const emeraldColor = [16, 185, 129] as [number, number, number];

    // 1. CABEÇALHO (HEADER) - Compact
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(0, 0, 210, 30, 'F');

    // Default logo from landing page which is more reliable than Google Drive
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/3273/3273398.png";
    const backupLogo = "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl";
    const logoToUse = logoUrlOverride || fallbackLogo || backupLogo;

    console.log("PDF Generator: Using logo source:", logoToUse ? (logoToUse.startsWith('data:') ? 'Base64 Data' : logoToUse) : 'None');

    let base64Logo = await getBase64ImageFromUrl(logoToUse);

    // If the selected logo fails, try the backup
    if (!base64Logo && logoToUse !== backupLogo) {
      console.log("PDF Generator: Primary logo failed, trying backup...");
      base64Logo = await getBase64ImageFromUrl(backupLogo);
    }

    if (base64Logo) {
      try {
        // Resize logo to be much smaller for PDF inclusion (helps with 2.6MB strings)
        base64Logo = await normalizeLogo(base64Logo, 200, 120);
        const format = base64Logo.includes('image/png') ? 'PNG' : 'JPEG';
        // Positioned more to the left and slightly adjusted size
        doc.addImage(base64Logo, format, 10, 3, 40, 24);
        console.log("PDF Generator: Logo added successfully with format:", format);
      } catch (e) {
        console.warn("PDF Generator: Logo failed to render", e);
      }
    } else {
      console.warn("PDF Generator: All logo sources failed");
    }

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    // Adjusted X position to 55 to be closer to the logo but distinct
    doc.text('D&E Hood Cleaning LLC', 55, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('Commercial Kitchen Exhaust Cleaning Services | dehoodcleaning@gmail.com', 55, 22);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`SERVICE REPORT`, 198, 16, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`#${service.reportNumber || service.id}`, 198, 22, { align: 'right' });

    let currentY = 35;

    // ==========================================
    // 2. UNIFIED COMPACT SECTION (CLIENT + SERVICE)
    // ==========================================
    const duration = calculateDuration(service.inspectionStartTime, service.completionTime);
    const formattedDate = formatDate(service.serviceDate);
    const startTime = formatTime(service.inspectionStartTime);
    const endTime = formatTime(service.completionTime);

    // Section Title
    doc.setFillColor(240, 240, 240);
    doc.rect(14, currentY - 4, 182, 6, 'F');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER PROFILE & SERVICE OPERATION SUMMARY", 16, currentY);
    currentY += 4;

    const unifiedData = [
      ['Restaurant Name', client?.name || service.restaurantName || 'N/A', 'Service Date', formattedDate],
      ['Address', `${client?.address || 'N/A'}, ${client?.city || ''}${client?.state ? ', ' + client.state : ''}`, 'Technician', service.technicianName || 'N/A'],
      ['Manager / Contact', `${client?.managerName || 'N/A'} (${client?.phone || 'N/A'})`, 'Duration', duration !== "N/A" ? duration : '--'],
      ['Establishment Type', client?.establishmentType || 'N/A', 'Start / End Time', `${startTime} / ${endTime}`],
      ['Hoods / Filters', `${client?.hoodCount || 0} / ${client?.filterCount || 0}`, 'Grease Volume', service.volume || 'N/A'],
      ['Duct Type/Height', `${client?.ductType || 'N/A'} - ${client?.ductHeight || 'N/A'}`, 'System Type', service.systemType || 'N/A'],
      ['Condition Before', service.conditionBefore || 'N/A', 'Compliance', service.nfpaCompliance ? 'COMPLIANT' : 'NON-COMPLIANT'],
      ['Fire Hazard', service.fireHazard ? 'HIGH RISK' : 'CONTROLLED', 'Ref. Report', service.reportNumber || service.id]
    ];

    autoTable(doc, {
      startY: currentY,
      body: unifiedData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32, fillColor: [250, 250, 250] },
        1: { cellWidth: 59 },
        2: { fontStyle: 'bold', cellWidth: 32, fillColor: [250, 250, 250] },
        3: { cellWidth: 59 }
      },
      didDrawCell: (data) => {
        // Highlight Compliance
        if (data.column.index === 3 && data.row.index === 6) {
          if (service.nfpaCompliance) {
            doc.setTextColor(16, 185, 129); // Emerald
          } else {
            doc.setTextColor(220, 38, 38); // Red
          }
        }
        // Highlight Fire Hazard
        if (data.column.index === 3 && data.row.index === 6 && service.fireHazard) {
          doc.setTextColor(220, 38, 38);
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Multi-column Checklist Renderer
    const renderChecklist = (title: string, dataStr: string, yPos: number, headerColor: [number, number, number] = emeraldColor, columns: number = 1): number => {
      let _y = yPos;
      if (_y > 260) { doc.addPage(); _y = 20; }

      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(14, _y - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(title, 16, _y);
      _y += 2;

      const checklist = parseJSON(dataStr);
      const entries = Object.entries(checklist);

      if (entries.length > 0) {
        if (columns === 3) {
          // Logic for 3 columns
          const rowsPerCol = Math.ceil(entries.length / 3);
          const body: any[][] = [];

          for (let i = 0; i < rowsPerCol; i++) {
            const row: any[] = [];
            for (let j = 0; j < 3; j++) {
              const index = i + (j * rowsPerCol);
              if (index < entries.length) {
                const [key, val] = entries[index];
                row.push(formatChecklistKey(key));
                row.push(val ? '[X]' : '[ ]');
              } else {
                row.push('');
                row.push('');
              }
            }
            body.push(row);
          }

          autoTable(doc, {
            startY: _y,
            body,
            theme: 'plain',
            styles: { cellPadding: 1, fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 45 }, 1: { cellWidth: 15, halign: 'right' },
              2: { cellWidth: 45 }, 3: { cellWidth: 15, halign: 'right' },
              4: { cellWidth: 45 }, 5: { cellWidth: 15, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
          });
        } else {
          // Standard 1 column
          const body = Object.entries(checklist).map(([key, val]) => [formatChecklistKey(key), val ? '[ X ] YES' : '[   ] NO']);
          autoTable(doc, {
            startY: _y,
            body,
            theme: 'plain',
            styles: { cellPadding: 1, fontSize: 8 },
            columnStyles: { 0: { cellWidth: 145 }, 1: { cellWidth: 37, fontStyle: 'bold', halign: 'right' } },
            margin: { left: 14, right: 14 }
          });
        }
        return (doc as any).lastAutoTable.finalY + 8;
      }
      return _y + 5;
    };

    // 3. PRE-CLEANING INSPECTION (3 COLUMNS) - ONLY MANDATORY ITEMS
    const preChecklistRaw = parseJSON(service.preCleaningChecklist);
    const mandatoryKeys = MANDATORY_PRE_CLEANING_CHECKLIST.map(item => item.id);
    const mandatoryOnly: Record<string, boolean> = {};

    mandatoryKeys.forEach(k => {
      mandatoryOnly[k] = preChecklistRaw[k] || false;
    });

    currentY = renderChecklist("PRE-CLEANING INSPECTION CHECKLIST (INITIAL STATE):", JSON.stringify(mandatoryOnly), currentY, [59, 130, 246], 3);

    // 4. POST-CLEANING QUALITY CHECK (1 COLUMN)
    currentY = renderChecklist("POST-CLEANING QUALITY CHECKLIST (FINAL STATUS):", service.completionChecklistAfter || '{}', currentY, emeraldColor, 1);

    // ==========================================
    // 5. NOTES / RECOMMENDATIONS
    // ==========================================
    if (service.notes && service.notes.trim() !== '') {
      if (currentY > 260) { doc.addPage(); currentY = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Notes / Recommendations:", 14, currentY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(service.notes, 182);
      doc.text(splitNotes, 14, currentY + 5);
      currentY += (splitNotes.length * 4) + 8;
    }

    // ==========================================
    // 5. ADDITIONAL INSPECTIONS (PRE-CLEANING OPTIONAL)
    // ==========================================
    const preCleaningChecklist = parseJSON(service.preCleaningChecklist);

    // Check if there are any optional items marked
    const optionalHoodKeys = ['opt_hood_grease', 'opt_hood_corrosion', 'opt_hood_welds', 'opt_hood_deep_clean'];
    const optionalFanKeys = ['opt_fan_vibration', 'opt_fan_noise', 'opt_fan_belt', 'opt_fan_struct', 'opt_fan_fire_risk', 'opt_fan_repair', 'opt_fan_new', 'opt_fan_maintenance'];
    const optionalDuctKeys = ['duct_grease_leak', 'duct_needs_panel', 'duct_obstruction'];

    const hasHoodOpts = optionalHoodKeys.some(k => preCleaningChecklist[k]);
    const hasFanOpts = optionalFanKeys.some(k => preCleaningChecklist[k]);
    const hasDuctOpts = optionalDuctKeys.some(k => preCleaningChecklist[k]);

    if (hasHoodOpts || hasFanOpts || hasDuctOpts) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }

      doc.setFillColor(70, 70, 70);
      doc.rect(14, currentY - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ADDITIONAL SYSTEM OBSERVATIONS & RECOMMENDATIONS", 16, currentY);
      currentY += 6;

      const renderOptSection = (title: string, keys: string[]) => {
        const markedItems = keys.filter(k => preCleaningChecklist[k]);
        if (markedItems.length === 0) return;

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, currentY);
        currentY += 4;

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        markedItems.forEach(k => {
          if (currentY > 275) { doc.addPage(); currentY = 20; }
          doc.text(`- ${LABEL_MAPPING[k] || k}`, 18, currentY);
          currentY += 4;
        });
        currentY += 2;
      };

      renderOptSection("HOOD STRUCTURE CONDITION:", optionalHoodKeys);
      renderOptSection("EXHAUST FAN CONDITIONS:", optionalFanKeys);
      renderOptSection("EXHAUST DUCTWORK OBSERVATIONS:", optionalDuctKeys);

      currentY += 4;
    }

    // Compact Photo Gallery Renderer
    const renderGallery = async (title: string, photosStr: string, yPos: number, barColor: [number, number, number] = [50, 50, 50]): Promise<number> => {
      let _y = yPos;
      if (_y > 220) { doc.addPage(); _y = 20; }

      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.rect(14, _y - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(title, 16, _y);
      _y += 6;

      const photos = parsePhotoArray(photosStr).filter((p: any) => p && typeof p === 'string' && p.trim() !== '');

      if (photos.length === 0) {
        doc.setFontSize(8); doc.setTextColor(150); doc.text("No photos were provided for this stage of the report.", 14, _y);
        return _y + 8;
      }

      const imgW = 89, imgH = 66, gap = 4;
      let col = 0;
      for (let i = 0; i < photos.length; i++) {
        if (_y + imgH > 275) { doc.addPage(); _y = 20; col = 0; }
        let base64 = await getBase64ImageFromUrl(photos[i]);
        if (base64) {
          try {
            // Padronizar imagem com Center Crop
            base64 = await centerCropImage(base64, 400, 300); // 400x300px base

            const x = 14 + (col * (imgW + gap));
            doc.setDrawColor(230, 230, 230);
            doc.rect(x - 0.5, _y - 0.5, imgW + 1, imgH + 1);
            doc.addImage(base64, 'JPEG', x, _y, imgW, imgH);

            doc.setFontSize(7); doc.setTextColor(120);
            doc.text(`Photo ${i + 1}`, x + (imgW / 2), _y + imgH + 4, { align: 'center' });
            col++;
            if (col > 1) { col = 0; _y += imgH + 10; }
          } catch (e) {
            console.error("Error drawing photo:", e);
          }
        }
      }
      if (col > 0) _y += imgH + 10;
      return _y + 5;
    };

    currentY = await renderGallery("INSPECTION PHOTOS (BEFORE CLEANING)", service.inspectionPhotosBefore || '[]', currentY, [100, 100, 100]);
    currentY = await renderGallery("COMPLETION PHOTOS (AFTER CLEANING)", service.completionPhotosAfter || '[]', currentY, [50, 50, 50]);

    // ==========================================
    // 6. FOOTER / SIGNATURES
    // ==========================================
    if (currentY > 230) { doc.addPage(); currentY = 30; } else { currentY += 10; }

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    const nfpaText = "This system has been cleaned in accordance with NFPA 96 standards. All work has been performed by certified technicians. Any remaining deficiencies are noted in the recommendations section.";
    const splitNfpa = doc.splitTextToSize(nfpaText, 180);
    doc.text(splitNfpa, 105, currentY, { align: 'center' });

    currentY += 20;
    (doc as any).setLineDash([0, 0], 0);
    doc.setDrawColor(0, 0, 0);
    doc.line(30, currentY, 90, currentY);
    doc.text("Technician Signature", 60, currentY + 4, { align: 'center' });
    doc.text(service.technicianName || 'D&E Technician', 60, currentY + 8, { align: 'center' });

    doc.line(120, currentY, 180, currentY);
    doc.text("Management / Client Signature", 150, currentY + 4, { align: 'center' });
    doc.text(`Date: ${formattedDate}`, 150, currentY + 8, { align: 'center' });

    const name = (service.restaurantName || client?.name || "Report").replace(/[^a-z0-9]/gi, '_');
    doc.save(`Service_Report_${name}.pdf`);
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};
