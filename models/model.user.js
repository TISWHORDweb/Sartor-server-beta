const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
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
    isverified: {
        type: Boolean,
        default: false,
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    userManagement: {
        type: Boolean,
        default: false,
    },
    payment: {
        type: Boolean,
        default: false,
    },
    sales: {
        type: Boolean,
        default: false,
    },
    lpo: {
        type: Boolean,
        default: false,
    },
    clg: {
        type: Boolean,
        default: false,
    },
    workflow: {
        type: Boolean,
        default: false,
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
    role: {
        type: String,
        enum: ["Manager", "Super-Admin", "Admin", "Sales Rep", "Inventory Manager", "Merchandiser"],
        default: "Manager"
    },
    userRole: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    type: { type: Number, default: 0 },
    adminID: { type: String },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelUser = mongoose.model("model-user", userSchema)

module.exports = ModelUser