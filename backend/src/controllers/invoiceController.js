const { generateAndSendInvoice } = require("../services/invoiceService");
const { success, error } = require("../utils/response");

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = await generateAndSendInvoice(orderId);
    return success(res, "Invoice generated and emailed", { invoiceUrl: url });
  } catch (err) {
    console.error(err);
    return error(res, err.message, 500);
  }
};

module.exports = { generateInvoice };
