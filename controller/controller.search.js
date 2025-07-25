const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelUser = require('../models/model.user');
const ModelLabel = require('../models/model.Label');
const ModelBatch = require('../models/model.batch');
const ModelCustomer = require('../models/model.customer');
const ModelInvoice = require('../models/model.invoice');
const ModelLead = require('../models/model.lead');
const ModelLeadContact = require('../models/model.leadContact');
const ModelLpo = require('../models/model.lpo');
const ModelLpoProduct = require('../models/model.lpoProduct');
const ModelProduct = require('../models/model.product');
const ModelRestock = require('../models/model.restock');
const ModelSupplier = require('../models/model.supplier');
const ModelTask = require('../models/model.task');
const ModelTaskComment = require('../models/model.taskComment');


// Model mapping configuration
const MODEL_CONFIG = {
    user: {
        model: ModelUser,
        searchFields: ['fullName', 'email', 'phone', 'address', 'userId'],
        populateFields: []
    },
    label: {
        model: ModelLabel,
        searchFields: ['status'],
        populateFields: [
            {
                path: 'batch',
                model: 'ModelBatch',
                searchFields: ['batchNumber', 'manufacturer', 'invoiceNumber', 'notes', 'status']
            },
            {
                path: 'product',
                model: 'ModelProduct',
                searchFields: ['productName', 'batchNumber', 'barcodeNumber', 'manufacturer', 'description', 'status']
            }
        ]
    },
    batch: {
        model: ModelBatch,
        searchFields: ['batchNumber', 'manufacturer', 'invoiceNumber', 'notes', 'status'],
        populateFields: [
            {
                path: 'supplier',
                model: 'ModelSupplier',
                searchFields: ['name', 'product', 'contactName', 'contactRole', 'contactNumber', 'phone', 'address', 'email', 'branch']
            },
            {
                path: 'product',
                model: 'ModelProduct',
                searchFields: ['productName', 'batchNumber', 'barcodeNumber', 'manufacturer', 'description', 'status']
            }
        ]
    },
    customer: {
        model: ModelCustomer,
        searchFields: ['customerId', 'status'],
        populateFields: [
            {
                path: 'lead',
                model: 'ModelLead',
                searchFields: ['name', 'address', 'email', 'phone', 'state', 'type', 'lga', 'dealSize', 'note', 'status']
            }
        ]
    },
    invoice: {
        model: ModelInvoice,
        searchFields: ['name', 'dueDate', 'totalAmount', 'qty', 'products', 'invoiceId', 'status'],
        populateFields: [
            {
                path: 'lpo',
                model: 'ModelLpo',
                searchFields: ['terms', 'status', 'lpoId']
            },
            {
                path: 'lead',
                model: 'ModelLead',
                searchFields: ['name', 'address', 'email', 'phone', 'state', 'type', 'lga', 'dealSize', 'note', 'status']
            }
        ]
    },
    lead: {
        model: ModelLead,
        searchFields: ['name', 'address', 'email', 'phone', 'state', 'type', 'lga', 'dealSize', 'note', 'status'],
        populateFields: []
    },
    leadcontact: {
        model: ModelLeadContact,
        searchFields: ['name', 'email', 'phone', 'role'],
        populateFields: [
            {
                path: 'lead',
                model: 'ModelLead',
                searchFields: ['name', 'address', 'email', 'phone', 'state', 'type', 'lga', 'dealSize', 'note', 'status']
            }
        ]
    },
    lpo: {
        model: ModelLpo,
        searchFields: ['terms', 'status', 'lpoId'],
        populateFields: [
            {
                path: 'lead',
                model: 'ModelLead',
                searchFields: ['name', 'address', 'email', 'phone', 'state', 'type', 'lga', 'dealSize', 'note', 'status']
            }
        ]
    },
    lpoproduct: {
        model: ModelLpoProduct,
        searchFields: ['quantity'],
        populateFields: [
            {
                path: 'lpo',
                model: 'ModelLpo',
                searchFields: ['terms', 'status', 'lpoId']
            },
            {
                path: 'product',
                model: 'ModelProduct',
                searchFields: ['productName', 'batchNumber', 'barcodeNumber', 'manufacturer', 'description', 'status']
            }
        ]
    },
    product: {
        model: ModelProduct,
        searchFields: ['productName', 'batchNumber', 'barcodeNumber', 'manufacturer', 'description', 'status'],
        populateFields: []
    },
    restock: {
        model: ModelRestock,
        searchFields: ['quantity'],
        populateFields: [
            {
                path: 'supplier',
                model: 'ModelSupplier',
                searchFields: ['name', 'product', 'contactName', 'contactRole', 'contactNumber', 'phone', 'address', 'email', 'branch']
            },
            {
                path: 'product',
                model: 'ModelProduct',
                searchFields: ['productName', 'batchNumber', 'barcodeNumber', 'manufacturer', 'description', 'status']
            }
        ]
    },
    supplier: {
        model: ModelSupplier,
        searchFields: ['name', 'product', 'contactName', 'contactRole', 'contactNumber', 'phone', 'address', 'email', 'branch'],
        populateFields: []
    },
    task: {
        model: ModelTask,
        searchFields: ['title', 'description', 'status', 'dueDate'],
        populateFields: [
            {
                path: 'user',
                model: 'ModelUser',
                searchFields: ['fullName', 'email', 'phone', 'address', 'userId', 'role']
            }
        ]
    },
    taskcomment: {
        model: ModelTaskComment,
        searchFields: ['comment'],
        populateFields: [
            {
                path: 'task',
                model: 'ModelTask',
                searchFields: ['title', 'description', 'status', 'dueDate']
            },
            {
                path: 'user',
                model: 'ModelUser',
                searchFields: ['fullName', 'email', 'phone', 'address', 'userId', 'role']
            }
        ]
    }
};

// Universal search function
exports.universalSearch = useAsync(async (req, res) => {
    try {
        const { collection, searchvalue } = req.body;
        
        if (!collection || !searchvalue) {
            return res.json(utils.JParser('Collection and search value are required', false, null));
        }

        const collectionKey = collection.toLowerCase();
        const config = MODEL_CONFIG[collectionKey];
        
        if (!config) {
            return res.json(utils.JParser('Invalid collection name', false, null));
        }

        // Build search query for main model
        const searchRegex = new RegExp(searchvalue, 'i'); // Case-insensitive search
        const mainSearchConditions = config.searchFields.map(field => ({
            [field]: searchRegex
        }));

        // Build populate conditions with search in populated fields
        const populateOptions = config.populateFields.map(popField => {
            const populateSearchConditions = popField.searchFields.map(field => ({
                [field]: searchRegex
            }));

            return {
                path: popField.path,
                match: populateSearchConditions.length > 0 ? { $or: populateSearchConditions } : {}
            };
        });

        // Execute the search
        let query = config.model.find({
            $or: mainSearchConditions
        });

        // Add population if there are populate fields
        if (populateOptions.length > 0) {
            populateOptions.forEach(popOption => {
                query = query.populate(popOption);
            });
        }

        const results = await query.exec();

        // Also search for documents where the search term exists in populated fields
        // This is for cases where the main document doesn't match but populated fields do
        if (config.populateFields.length > 0) {
            let populatedSearchQuery = config.model.find({});
            
            populateOptions.forEach(popOption => {
                populatedSearchQuery = populatedSearchQuery.populate(popOption);
            });

            const allPopulatedResults = await populatedSearchQuery.exec();
            
            // Filter results where populated fields match the search term
            const additionalResults = allPopulatedResults.filter(doc => {
                return config.populateFields.some(popField => {
                    const populatedData = doc[popField.path];
                    if (!populatedData) return false;
                    
                    return popField.searchFields.some(field => {
                        const value = populatedData[field];
                        return value && value.toString().toLowerCase().includes(searchvalue.toLowerCase());
                    });
                });
            });

            // Merge results and remove duplicates
            const combinedResults = [...results];
            additionalResults.forEach(additionalResult => {
                if (!results.find(r => r._id.toString() === additionalResult._id.toString())) {
                    combinedResults.push(additionalResult);
                }
            });

            return res.json(utils.JParser(`Search completed for ${collection}`, true, combinedResults));
        }

        return res.json(utils.JParser(`Search completed for ${collection}`, true, results));

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});
