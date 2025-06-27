const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema({
    batchNumber: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    manufacturingDate: {
        type: Number, 
        required: true
    },
    expiryDate: {
        type: Number 
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-supplier'
    },
    costPrice: {
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