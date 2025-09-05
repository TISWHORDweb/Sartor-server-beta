const mongoose = require('mongoose')

const lpoSchema = new mongoose.Schema({
    lpo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lpo',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


// Auto-exclude deleted documents from queries
lpoSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelLpoProduct = mongoose.model("model-lpo-product", lpoSchema)

module.exports = ModelLpoProduct