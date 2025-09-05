const mongoose = require('mongoose')

const commissionSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["All", "Manager", "Super-Admin", "Admin", "Sales Rep", "Inventory Manager", "Merchandiser"],
        default: "All"
    },
    price: {
        type: Number,
        min: 0
    },
    status: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


// Auto-exclude deleted documents from queries
commissionSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelCommission = mongoose.model("model-commission", commissionSchema)

module.exports = ModelCommission