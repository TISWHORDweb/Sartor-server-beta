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
    pin: {
        type: String,
        // unique: true, // Unique is good but need to ensure it doesn't conflict globally or handle errors
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCount: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
    },
    subImage: {
        type: String,
    },
    status: {
        type: String,
        enum: ['failed', 'completed', 'training', 'active'],
        default: 'active'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin',
        required: true
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