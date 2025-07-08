const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema({
    batchNumber: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String
    },
    invoiceNumber: {
        type: String
    },
    image: {
        type: String
    },
    receipt: {
        type: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    expiryDate: {
        type: Number
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-supplier'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product'
    },
    supplyPrice: {
        type: Number,
        min: 0
    },
    sellingPrice: {
        type: Number,
        min: 0
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'sold-out', 'recalled'],
        default: 'active'
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

const ModelBatch = mongoose.model("model-batch", batchSchema)

module.exports = ModelBatch