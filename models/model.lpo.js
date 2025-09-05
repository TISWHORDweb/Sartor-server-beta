const mongoose = require('mongoose')

const lpoSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    terms: {
        type: String,
        enum: ["Payment On Delivery", "⁠Full Payment after 70% stock sold", "⁠Payment 2 weeks after delivery"],  // specifies allowed values
        default: "Payment On Delivery"                    // default value if none provided
    },
    status: {
        type: String,
        enum: ["Delivered", "In Transit", "Processing", "Cancelled", "Sorted", "Received", "Overdue", "To-Do", "Confirmed"],
        default: "Processing"
    },
    lpoId: {
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
lpoSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelLpo = mongoose.model("model-lpo", lpoSchema)

module.exports = ModelLpo