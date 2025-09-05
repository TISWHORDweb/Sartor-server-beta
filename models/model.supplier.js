const mongoose = require('mongoose')

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    product: {
        type: String,
    },
    contactName: {
        type: String,
    },
    contactRole: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    email: {
        type: String,
    },
    branch: {
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
supplierSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});


const ModelSupplier = mongoose.model("model-supplier", supplierSchema)

module.exports = ModelSupplier