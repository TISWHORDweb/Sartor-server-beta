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
    paymentConfirmation: {
        type: Boolean,
        default: false,
    },
    sales: {
        type: Boolean,
        default: false,
    },
    lpoReconciliation: {
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
    lpoWorkflow: {
        type: Boolean,
        default: false,
    },
    delivery: {
        type: Boolean,
        default: false,
    },
    performanceMonitoring: {
        type: Boolean,
        default: false,
    },
    promotionalManagement: {
        type: Boolean,
        default: false,
    },
    paymentHandling: {
        type: Boolean,
        default: false,
    },
    fieldActivity: {
        type: Boolean,
        default: false,
    },
    visit: {
        type: Boolean,
        default: false,
    },
    lpoManagement: {
        type: Boolean,
        default: false,
    },
    marketingResources: {
        type: Boolean,
        default: false,
    },
    followUp: {
        type: Boolean,
        default: false,
    },
    paymentVisibility: {
        type: Boolean,
        default: false,
    },
    online: {
        type: String,
    },
    userId: {
        type: String,
    },
    role: {
        type: String,
        enum: ["Manager", "Admin", "Sales Rep", "Inventory Manager", "Merchandiser", "Driver"],
        default: "Manager"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    passwordChanged: {
        type: Boolean,
        default: false
    },
    userRole: {
        type: String,
        default: "user"
    },
    type: { type: Number, default: 0 },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin'
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

userSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelUser = mongoose.model("model-user", userSchema)

module.exports = ModelUser