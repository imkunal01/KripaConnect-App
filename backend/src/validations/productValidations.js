const { body } = require("express-validator");

exports.productCreateValidation = [
  body("name").notEmpty(),
  body("price").isNumeric(),
  body("stock").isNumeric(),
];

exports.productUpdateValidation = [
  body("price").optional().isNumeric(),
  body("stock").optional().isNumeric(),
];
