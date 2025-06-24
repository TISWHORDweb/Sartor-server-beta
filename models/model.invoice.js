const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
    lpo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lpo',
        required: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    name: {
        type: String,
    },
    dueDate: {
        type: String,
    },
    totalAmount: {
        type: String,
    },
    qty: {
        type: String,
    },
    products: {
        type: String,
    },
    invoiceId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Paid", "Processing", "Cancelled", "Overdue", "Pending", "Partially Paid"],
        default: "Processing"
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelInvoice = mongoose.model("model-invoice", invoiceSchema)

module.exports = ModelInvoice