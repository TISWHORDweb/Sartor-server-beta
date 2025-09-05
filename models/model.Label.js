const mongoose = require('mongoose')

const labelSchema = new mongoose.Schema({
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-batch',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    image: {
        type: String,
    },
    subImage: {
        type: String,
    },
    status: {
        type: String,
        enum: ['failed', 'completed', 'training'],
        default: 'training'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

// Auto-exclude deleted documents from queries
labelSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelLabel = mongoose.model("model-label", labelSchema)

module.exports = ModelLabel