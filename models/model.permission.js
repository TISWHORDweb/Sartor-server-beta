const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user',
    },
    userManagement: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    paymentConfirmation: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    sales: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    lpoReconciliation: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    clg: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    workflow: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    lpoWorkflow: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    delivery: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    performanceMonitoring: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    promotionalManagement: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    paymentHandling: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    fieldActivity: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    visit: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    lpoManagement: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    marketingResources: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    followUp: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    paymentVisibility: {
        status: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

// Auto-exclude deleted documents from queries
permissionSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelPermission = mongoose.model('permission', permissionSchema);

module.exports = ModelPermission