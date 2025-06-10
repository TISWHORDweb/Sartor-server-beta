const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: ["Manager", "Admin", "Sales Rep", "Inventory Manager", "Merchandiser"],
        default: "Manager"                    // default value if none provided
    },
    type: { type: Number, default: 0 },
    adminID: { type: String },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelEmployee = mongoose.model("model-new-employee", employeeSchema)

module.exports = ModelEmployee