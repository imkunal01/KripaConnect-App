const { body } = require("express-validator");

exports.orderCreateValidation = [
  body("items").isArray().withMessage("Items must be an array"),
  body("shippingAddress.name").notEmpty(),
  body("shippingAddress.phone").notEmpty(),
  body("shippingAddress.city").notEmpty(),
  body("shippingAddress.pincode").notEmpty(),
];
