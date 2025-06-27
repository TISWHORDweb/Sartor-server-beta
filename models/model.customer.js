const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    customerId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Active", "In-active"],
        default: "Active"
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelCustomer = mongoose.model("model-customer", customerSchema)

module.exports = ModelCustomer