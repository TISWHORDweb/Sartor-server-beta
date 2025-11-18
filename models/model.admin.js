const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    address: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    image: {
        type: String,
    },
    password: {
        type: String,
    },
    token: {
        type: String,
    },
    lastLogin: {
        type: String,
    },
    online: {
        type: String,
    },
    userId: {
        type: String,
    },
    userRole: {
        type: String,
        default: "admin"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    passwordChanged: {
        type: Boolean,
        default: true
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        default: "Super-Admin"
    },
    type: { type: Number, default: 0 },
    adminID: { type: String },
    isDisabled: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

adminSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelAdmin = mongoose.model("model-admin", adminSchema)

module.exports = ModelAdmin