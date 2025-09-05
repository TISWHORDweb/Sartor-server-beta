const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
    },
    batchNumber: {
        type: String,
    },
    barcodeNumber: {
        type: String,
    },
    manufacturer: {
        type: String,
    },
    description: {
        type: String,
    },
    productImage: {
        type: String,
    },
    price: {
        type: Number,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    lastPriceUpdate: { type: Date },
    status: {
        type: String,
        enum: ["In-Stock  ", "Out of Stock"],
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    batchId: { type: String },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

// Auto-exclude deleted documents from queries
productSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelProduct = mongoose.model("model-product", productSchema)

module.exports = ModelProduct