const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { orderCreateValidation } = require("../validations/orderValidations");
const validate = require("../middleware/validate");


router.post("/", protect, orderCreateValidation, validate, orderController.createOrder);
router.get("/my", protect, orderController.getMyOrders);
router.get("/", protect, adminOnly, orderController.getAllOrders);
router.get("/:id", protect, orderController.getOrderById);
router.get("/:id/invoice", protect, require("../controllers/invoiceController").downloadInvoice);
router.put("/:id/cancel", protect, orderController.cancelOrder);
router.put("/:id/status", protect, adminOnly, orderController.updateOrderStatus);
router.delete("/:id", protect, adminOnly, orderController.deleteOrder);

module.exports = router;
