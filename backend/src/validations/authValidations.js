const { body } = require("express-validator");

exports.registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 chars")
    .matches(/(?=.*[a-z])/).withMessage("Must include lowercase")
    .matches(/(?=.*[A-Z])/).withMessage("Must include uppercase")
    .matches(/(?=.*\d)/).withMessage("Must include a number")
    .matches(/(?=.*[\W_])/).withMessage("Must include a symbol"),
];

exports.loginValidation = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];
