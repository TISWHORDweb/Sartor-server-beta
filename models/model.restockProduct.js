const mongoose = require('mongoose')

const restockProductSchema = new mongoose.Schema({
    restock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-restock',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    quantity: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

// Auto-exclude deleted documents from queries
restockProductSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelRestockProduct = mongoose.model("model-restock-product", restockProductSchema)

module.exports = ModelRestockProduct