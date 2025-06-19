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
        enum: ["Pharmacy  ", "Clinic"],  // specifies allowed values
    },
    image: {
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
    userId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Contacted  ", "Order Fulfilled", "Closed Lost", "Follow Up", "Qualified", "Interested", "Hold", "In-Negotiations", "LPO Generated", "Closed Won", "Payment Confirmed"],  // specifies allowed values
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelLead = mongoose.model("model-lead", leadSchema)

module.exports = ModelLead