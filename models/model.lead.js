const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
    name: {
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
    state: {
        type: String,
    },
    type: {
        type: String,
    },
    image: {
        type: String,
    },
    state: {
        type: String,
    },
    lga: {
        type: String,
    },
    dealSize: {
        type: String,
    },
    note: {
        type: String,
    },
    stores: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user',
        required: true
    },
    userId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Contacted", "Order Fulfilled", "Closed Lost", "Follow Up", "Qualified", "Interested", "Hold", "In-Negotiations", "LPO Generated", "Closed Won", "Payment Confirmed"],
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

// Auto-exclude deleted documents from queries
leadSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelLead = mongoose.model("model-lead", leadSchema)

module.exports = ModelLead