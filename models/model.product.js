const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-supplier',
        required: true
    },
    batchNumber: {
        type: String,
    },
    barcodeNumber: {
        type: String,
    },
    quantity: {
        type: String,
    },
    unit: {
        type: String,
    },
    buyingPrice: {
        type: String,
    },
    expiryDate: {
        type: String,
    },
    description: {
        type: String,
    },
    sellingPrice: {
        type: String,
    },
    productImage: {
        type: String,
    },
    status: {
        type: String,
        enum: ["In-Stock  ", "Out of Stock"], 
    },
    batchId: { type: String },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelProduct = mongoose.model("model-product", productSchema)

module.exports = ModelProduct