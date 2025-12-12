const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true
    },    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        enum: ['customer', 'retailer','admin' ],
        default: 'customer'
    },
    profilePhoto: { type: String },
    isBlocked: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            qty: { type: Number, required: true, min: 1 }
        }
    ]
}, { timestamps: true });

userSchema.pre('save',async function (next){
    if(!this.isModified('password')){
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    next();
})

userSchema.methods.matchPassword= async function (enterPassword){
    return await bcrypt.compare(enterPassword,this.password)
}

const User = mongoose.model('User', userSchema);

module.exports = User;
