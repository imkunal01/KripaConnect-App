const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += (nArr[1] != 0) ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += (nArr[2] != 0) ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += (nArr[3] != 0) ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += (nArr[4] != 0) ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += (nArr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  }
  return inWords(Math.round(num)) + ' Rupees Only';
}

/**
 * Generates an official, perfectly-aligned Indian GST Tax Invoice PDF.
 * @param {Object} order - Order document populated with items
 * @param {Object} user - User document
 * @returns {Promise<string>} - Path to generated PDF file
 */
async function generateInvoicePDF(order, user) {
  return new Promise((resolve, reject) => {
    try {
      // Standard A4: 595.28 x 841.89 points
      const doc = new PDFDocument({ margin: 36, size: "A4" });

      const fileName = `GST_Invoice_${order._id}.pdf`;
      const tempDir = path.join(__dirname, "../../temp");
      try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
      const filePath = path.join(tempDir, fileName);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const isRetailer = (order.purchaseMode === 'retailer') || (user?.role === 'retailer');
      const invoiceNo = `KC-INV-${order._id.toString().slice(-8).toUpperCase()}`;
      const shortOrderId = order._id.toString().slice(-8).toUpperCase();
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const startX = 36;
      const totalWidth = 523;

      // ==========================================
      // 1. HEADER SECTION (Brand + Tax Invoice Tag)
      // ==========================================
      doc.rect(startX, 36, totalWidth, 68).fill("#0f172a");

      // Left: Company Identity
      doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold").text("KRIPACONNECT", 48, 46);
      doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8")
        .text("ELECTRONICS & APPLIANCES PVT. LTD.", 48, 68)
        .text("GSTIN: 23AAACK8842F1Z8  |  CIN: U52100MP2024PTC068942", 48, 80);

      // Right: Invoice Metadata (bounded to prevent overflow)
      doc.fillColor("#ffffff").fontSize(13).font("Helvetica-Bold").text("TAX INVOICE", 345, 46, { width: 200, align: "right" });
      doc.fontSize(7.5).font("Helvetica").fillColor("#cbd5e1")
        .text("Original for Recipient", 345, 62, { width: 200, align: "right" })
        .text(`Invoice No: ${invoiceNo}`, 345, 74, { width: 200, align: "right" })
        .text(`Invoice Date: ${orderDate}`, 345, 86, { width: 200, align: "right" });

      // ==========================================
      // 2. SUPPLIER & BUYER INFORMATION (2 Column)
      // ==========================================
      const infoTop = 114;
      const colWidth = 256;
      const gap = 11;

      // Supplier Box (Left)
      doc.rect(startX, infoTop, colWidth, 105).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold").text("SOLD BY / DISPATCH LOCATION:", 46, infoTop + 8);
      doc.fontSize(7.5).font("Helvetica").fillColor("#334155")
        .text("KripaConnect Central Fulfillment Hub", 46, infoTop + 22)
        .text("Plot 104, Sector B, A.B. Road Industrial Area", 46, infoTop + 34)
        .text("Indore, Madhya Pradesh - 452001", 46, infoTop + 46)
        .text("State: Madhya Pradesh (State Code: 23)", 46, infoTop + 58)
        .text("Support Email: support@kripaconnect.in", 46, infoTop + 70)
        .text("Helpline: +91 98765 43210", 46, infoTop + 82);

      // Buyer Box (Right)
      const ship = order.shippingAddress || {};
      const buyerName = ship.name || user?.name || "Customer";
      const buyerPhone = ship.phone || user?.phone || "N/A";
      const buyerAddr = ship.addressLine || "Indore";
      const buyerCityState = `${ship.city || 'Indore'}, ${ship.state || 'Madhya Pradesh'} - ${ship.pincode || '452001'}`;
      const buyerGstin = user?.retailerDetails?.businessProof || "Unregistered Consumer";

      doc.rect(startX + colWidth + gap, infoTop, colWidth, 105).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold").text("BILLED & SHIPPED TO:", startX + colWidth + gap + 10, infoTop + 8);
      doc.fontSize(7.5).font("Helvetica").fillColor("#334155")
        .text(`Name: ${buyerName}`, startX + colWidth + gap + 10, infoTop + 22, { width: 236, ellipsis: true })
        .text(`Address: ${buyerAddr}`, startX + colWidth + gap + 10, infoTop + 34, { width: 236, height: 20, ellipsis: true })
        .text(buyerCityState, startX + colWidth + gap + 10, infoTop + 56, { width: 236, ellipsis: true })
        .text(`Phone: ${buyerPhone}`, startX + colWidth + gap + 10, infoTop + 68)
        .text(`GSTIN: ${isRetailer ? buyerGstin : 'Unregistered (B2C)'}`, startX + colWidth + gap + 10, infoTop + 80)
        .text(`Place of Supply: Madhya Pradesh (23)`, startX + colWidth + gap + 10, infoTop + 92);

      // ==========================================
      // 3. ORDER METADATA BAR (Strict 4-Column Bounds)
      // ==========================================
      const metaTop = 227;
      doc.rect(startX, metaTop, totalWidth, 22).fillAndStroke("#eff6ff", "#bfdbfe");

      doc.fillColor("#1e3a8a").fontSize(7.5).font("Helvetica-Bold")
        .text(`Order ID: #${shortOrderId}`, 46, metaTop + 6, { width: 130, ellipsis: true })
        .text(`Type: ${isRetailer ? 'B2B Wholesale' : 'Retail Purchase'}`, 180, metaTop + 6, { width: 130, ellipsis: true })
        .text(`Payment: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Prepaid)'}`, 315, metaTop + 6, { width: 130, ellipsis: true })
        .text(`Status: ${(order.paymentStatus || 'PAID').toUpperCase()}`, 450, metaTop + 6, { width: 95, align: "right" });

      // ==========================================
      // 4. ITEM TABLE (Explicit cell bounding)
      // ==========================================
      const tableTop = 257;
      doc.rect(startX, tableTop, totalWidth, 20).fill("#1e293b");

      // Column definitions (Sum = 523)
      // 1. # (24) -> 36 to 60
      // 2. Description (190) -> 60 to 250
      // 3. HSN (45) -> 250 to 295
      // 4. Qty (30) -> 295 to 325
      // 5. Unit Price (60) -> 325 to 385
      // 6. Taxable (60) -> 385 to 445
      // 7. GST 18% (45) -> 445 to 490
      // 8. Total (69) -> 490 to 559

      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold")
        .text("#", 38, tableTop + 6, { width: 20, align: "center" })
        .text("Description of Goods", 64, tableTop + 6, { width: 180 })
        .text("HSN", 250, tableTop + 6, { width: 45, align: "center" })
        .text("Qty", 295, tableTop + 6, { width: 30, align: "center" })
        .text("Unit Price", 325, tableTop + 6, { width: 55, align: "right" })
        .text("Taxable (INR)", 385, tableTop + 6, { width: 55, align: "right" })
        .text("GST (18%)", 445, tableTop + 6, { width: 45, align: "right" })
        .text("Total (INR)", 495, tableTop + 6, { width: 55, align: "right" });

      let currentY = tableTop + 20;
      let subtotalTaxable = 0;
      let totalGst = 0;

      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item, index) => {
        const itemTotal = Number(item.price || 0) * Number(item.qty || 1);
        const taxable = itemTotal / 1.18;
        const gstAmount = itemTotal - taxable;

        subtotalTaxable += taxable;
        totalGst += gstAmount;

        const isEven = index % 2 === 0;
        doc.rect(startX, currentY, totalWidth, 20).fill(isEven ? "#ffffff" : "#f8fafc");

        doc.fillColor("#0f172a").fontSize(7).font("Helvetica")
          .text(String(index + 1), 38, currentY + 5, { width: 20, align: "center" })
          .text(item.name || item.product?.name || "Electronic Device", 64, currentY + 5, { width: 180, ellipsis: true })
          .text(item.product?.hsn || "8528", 250, currentY + 5, { width: 45, align: "center" })
          .text(String(item.qty || 1), 295, currentY + 5, { width: 30, align: "center" })
          .text(Number(item.price || 0).toLocaleString('en-IN'), 325, currentY + 5, { width: 55, align: "right" })
          .text(taxable.toFixed(2), 385, currentY + 5, { width: 55, align: "right" })
          .text(gstAmount.toFixed(2), 445, currentY + 5, { width: 45, align: "right" })
          .text(itemTotal.toLocaleString('en-IN'), 495, currentY + 5, { width: 55, align: "right" });

        doc.rect(startX, currentY, totalWidth, 20).stroke("#e2e8f0");
        currentY += 20;
      });

      // ==========================================
      // 5. TAX SUMMARY & TOTALS BLOCK
      // ==========================================
      const cgst = totalGst / 2;
      const sgst = totalGst / 2;
      const grandTotal = Number(order.totalAmount || 0);

      currentY += 10;
      const summaryBoxHeight = 92;
      const leftSummaryWidth = 310;
      const rightSummaryWidth = 203;

      // Left Box: Amount in words & GST split
      doc.rect(startX, currentY, leftSummaryWidth, summaryBoxHeight).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text("INVOICE AMOUNT IN WORDS:", 46, currentY + 8);
      doc.fontSize(7).font("Helvetica").fillColor("#334155").text(`INR ${numberToWords(grandTotal)}`, 46, currentY + 20, { width: 290 });

      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text("GST BREAKDOWN (INTRA-STATE 23-MP):", 46, currentY + 44);
      doc.fontSize(7).font("Helvetica").fillColor("#475569")
        .text(`Taxable Goods Value: Rs. ${subtotalTaxable.toFixed(2)}`, 46, currentY + 56)
        .text(`CGST @ 9%: Rs. ${cgst.toFixed(2)}  |  SGST @ 9%: Rs. ${sgst.toFixed(2)}`, 46, currentY + 68)
        .text("Applicable Supply: Intra-State B2C/B2B Commerce", 46, currentY + 80);

      // Right Box: Totals Breakdown (Bounded numbers to prevent right overflow)
      const rightBoxX = startX + leftSummaryWidth + 10;
      doc.rect(rightBoxX, currentY, rightSummaryWidth, summaryBoxHeight).fillAndStroke("#ffffff", "#e2e8f0");

      doc.fontSize(7.5).font("Helvetica").fillColor("#475569")
        .text("Taxable Value:", rightBoxX + 10, currentY + 8, { width: 90 })
        .text(`Rs. ${subtotalTaxable.toFixed(2)}`, rightBoxX + 100, currentY + 8, { width: 93, align: "right" })
        .text("CGST (9%):", rightBoxX + 10, currentY + 22, { width: 90 })
        .text(`Rs. ${cgst.toFixed(2)}`, rightBoxX + 100, currentY + 22, { width: 93, align: "right" })
        .text("SGST (9%):", rightBoxX + 10, currentY + 36, { width: 90 })
        .text(`Rs. ${sgst.toFixed(2)}`, rightBoxX + 100, currentY + 36, { width: 93, align: "right" })
        .text("Freight / Shipping:", rightBoxX + 10, currentY + 50, { width: 90 })
        .text("FREE", rightBoxX + 100, currentY + 50, { width: 93, align: "right" });

      // Grand Total Highlight Pill
      doc.rect(rightBoxX, currentY + 64, rightSummaryWidth, 28).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold")
        .text("TOTAL (INR):", rightBoxX + 10, currentY + 73, { width: 85 })
        .text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, rightBoxX + 90, currentY + 73, { width: 103, align: "right" });

      // ==========================================
      // 6. TERMS & SIGNATURE FOOTER
      // ==========================================
      const footerTop = currentY + summaryBoxHeight + 14;
      const termsWidth = 340;
      const signWidth = 173;

      doc.rect(startX, footerTop, termsWidth, 68).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.rect(startX + termsWidth + 10, footerTop, signWidth, 68).fillAndStroke("#f8fafc", "#e2e8f0");

      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text("DECLARATION & TERMS:", 46, footerTop + 6);
      doc.fontSize(6.5).font("Helvetica").fillColor("#64748b")
        .text("1. All items covered by official manufacturer warranty terms.", 46, footerTop + 18)
        .text("2. 7-Day easy replacement policy applies for transit defects.", 46, footerTop + 28)
        .text("3. Computer-generated official Indian GST Tax Invoice.", 46, footerTop + 38)
        .text("4. Subject to exclusive Indore, Madhya Pradesh jurisdiction.", 46, footerTop + 48);

      const signBoxX = startX + termsWidth + 10;
      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text("KRIPACONNECT PVT. LTD.", signBoxX, footerTop + 6, { width: signWidth, align: "center" });
      doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text("[DIGITALLY GENERATED & CERTIFIED]", signBoxX, footerTop + 38, { width: signWidth, align: "center" });
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#0f172a").text("Authorized Signatory", signBoxX, footerTop + 50, { width: signWidth, align: "center" });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
