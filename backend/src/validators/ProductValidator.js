const {body ,validationResult} = require('express-validator');

const createProductRules= [
    body("name").notEmpty().withMessage("Product name is required"),
    body("price").isNumeric().withMessage("Price must be a number"),

];

const updateProductRules = [
    body("price").optional().isNumeric().withMessage("Price must be a number"),

]

function validate (req,res,next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    next();
}
module.exports = {
    createProductRules,
    updateProductRules,
    validate
}