const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generates a PDF invoice and returns the local file path.
 * @param {Object} order - Order document
 * @param {Object} user - User document
 * @returns {Promise<string>} - path to PDF file
 */
async function generateInvoicePDF(order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });

      // file path (temporary)
      const fileName = `invoice_${order._id}.pdf`;
      const tempDir = path.join(__dirname, "../../temp");
      try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
      const filePath = path.join(tempDir, fileName);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // header
      doc.fontSize(22).text("Smart Electronics Store", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12).text("Pachore, Madhya Pradesh");
      doc.text("Email: smartecom@example.com");
      doc.moveDown(1);

      // invoice info
      doc.fontSize(16).text(`Invoice #${order._id}`, { align: "left" });
      doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Payment Method: ${order.paymentMethod}`);
      doc.text(`Payment Status: ${order.paymentStatus}`);
      doc.moveDown(1);

      // customer info
      doc.fontSize(14).text("Bill To:", { underline: true });
      doc.fontSize(12).text(user.name);
      doc.text(order.shippingAddress.addressLine);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
      doc.text(`Phone: ${order.shippingAddress.phone}`);
      doc.moveDown(1);

      // table header
      doc.fontSize(14).text("Order Details:", { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50, col2 = 250, col3 = 380, col4 = 460;

      doc.fontSize(12)
        .text("Product", col1, tableTop)
        .text("Qty", col2, tableTop)
        .text("Price", col3, tableTop)
        .text("Total", col4, tableTop);

      let y = tableTop + 20;
      order.items.forEach((item) => {
        const total = item.qty * item.price;
        doc.text(item.name, col1, y)
           .text(item.qty, col2, y)
           .text(`₹${item.price}`, col3, y)
           .text(`₹${total}`, col4, y);
        y += 20;
      });

      doc.moveDown(1);
      doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, { align: "right" });
      doc.moveDown(2);
      doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
