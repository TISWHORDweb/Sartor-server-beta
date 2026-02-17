const dotenv = require("dotenv")
const fs = require('fs');
const path = require('path');
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const axios = require('axios');
const FormData = require('form-data');
const ModelLabel = require("../models/model.Label");
const ModelProduct = require("../models/model.product");
const ModelBatch = require("../models/model.batch");
const Joi = require("joi");
const { uploadToCloudinary } = require("../core/core.cloudinary");



exports.CreateLabel = useAsync(async (req, res) => {
    try {
        const admin = req.adminID

        const labelSchema = Joi.object({
            batch: Joi.string().required(),
            product: Joi.string().required(),
        });

        const validator = await labelSchema.validateAsync(req.body);
        validator.admin = admin

        const newLabel = await ModelLabel.create(validator);

        return res.status(201).json(
            utils.JParser('Label created successfully', true, newLabel)
        );
    } catch (e) {
        throw new errorHandle(e.message, e.details ? 400 : 500);
    }
});

exports.GetAllLabels = useAsync(async (req, res) => {
    try {
        const admin = req.adminID;
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const search = req.query.search ? req.query.search.trim() : null;

        // Base filter
        let filter = { admin };
        if (req.query.batch) {
            filter.batch = req.query.batch;
        }
        if (req.query.batch) {
            filter.batch = req.query.batch;
        }
        if (req.query.batch) {
            filter.batch = req.query.batch;
        }

        // Search support
        if (search) {
            const searchRegex = new RegExp(search, "i");
            filter.$or = [
                { status: searchRegex },
                { image: searchRegex },
                { subImage: searchRegex }
            ];
        }

        let query = ModelLabel.find(filter)
            .populate("product")
            .populate({
                path: "batch",
                populate: { path: "supplier" }
            })
            .sort({ _id: -1 })
            .lean();

        if (limit !== null) query = query.skip(skip).limit(limit);

        const labels = await query.exec();

        const response = utils.JParser("Labels fetched successfully", true, { data: labels });

        if (limit !== null) {
            const totalLabels = await ModelLabel.countDocuments(filter);
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalLabels / limit),
                totalLabels,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.GetLabel = useAsync(async (req, res) => {
    try {
        const label = await ModelLabel.findById(req.params.id).populate('product').populate('batch').lean();
        if (!label) throw new errorHandle('Label not found', 404);

        return res.json(utils.JParser('Label fetched successfully', true, label));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.UpdateLabel = useAsync(async (req, res) => {
    try {
        const updatedLabel = await ModelLabel.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedLabel) throw new errorHandle('Label not found', 404);

        return res.json(
            utils.JParser('Label updated successfully', true, updatedLabel)
        );
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.DeleteLabel = useAsync(async (req, res) => {
    try {
        const label = await ModelLabel.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                updated_at: Date.now()
            },
            { new: true }
        );
        if (!label) throw new errorHandle('Label not found', 404);

        return res.json(
            utils.JParser('Label deleted successfully', true, null)
        );
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.labelTrainWebhook = useAsync(async (req, res) => {
    try {

        const token = req.headers['s-token'];
        console.log(req)

        if (token !== process.env.WEBHOOK_TOKEN) {
            return res.status(404).json(utils.JParser('Invalid token', false, []));
        }

        const schema = Joi.object({
            label_id: Joi.string().required(),
            status: Joi.string().required(),
        });

        const validator = await schema.validateAsync(req.body);
        const id = validator.label_id
        const label = await ModelLabel.findByIdAndUpdate(id, { status: validator.status }, { new: true });

        if (!label) {
            return res.status(404).json(utils.JParser('label not found', false, []));
        }

        return res.json(utils.JParser('Received', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


const callTrainingAPI = async (labelId) => {
    try {
        const response = await axios.post(`${process.env.LABEL_BASE_URL}/train`, {
            label_id: labelId
        });
        console.log("trained");
        return response.data;

    } catch (error) {
        console.error('Training API error:', error);
        throw new Error('Training API call failed');
    }
};


exports.uploadLabel = useAsync(async (req, res) => {
    let tempFiles = [];

    try {
        const { productId, batchId } = req.body;
        const form = new FormData();
        let imagePath = '';

        if (req.file) {
            // Upload to Cloudinary and get URL
            try {
                console.log("Starting Cloudinary upload for:", req.file.path);
                imagePath = await uploadToCloudinary(req.file.path);
                console.log("Cloudinary Upload Successful:", imagePath);

                // Optional: Clean up local file after upload
                // fs.unlinkSync(req.file.path); 
            } catch (cloudError) {
                console.error("Cloudinary Upload Failed:", cloudError);
                // Fallback to local path or throw error? 
                // For now, let's throw to ensure data consistency
                throw new Error("Failed to upload image to cloud storage");
            }

            // We still need to send a stream to the external API if that's what it expects
            // But for our DB, we use the Cloudinary URL
            form.append('image', fs.createReadStream(req.file.path), {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
        }

        // Update product if productId is provided
        if (productId) {
            await ModelProduct.findByIdAndUpdate(productId, {
                productImage: imagePath, // Save Cloudinary URL
                updated_at: Date.now()
            });
        }

        // Update batch if batchId is provided
        if (batchId) {
            await ModelBatch.findByIdAndUpdate(batchId, {
                image: imagePath, // Save Cloudinary URL
                updated_at: Date.now()
            });
        }

        if (req.body && Object.keys(req.body).length) {
            try {
                form.append('metadata', JSON.stringify(req.body));
            } catch (err) {
                form.append('metadata', '{}');
            }
        }
        const url = `${process.env.LABEL_BASE_URL}/reference/upload`;
        const apiResponse = await axios.post(url, form, { headers: form.getHeaders() });
    
        console.log(url);
        console.log(apiResponse);

        return res.json(utils.JParser('Reference product saved successfully', true, apiResponse.data));

    } catch (e) {
        console.log("newerror.  " + e);

        throw new errorHandle(e.message, 500);
    }
});


exports.VerifyPin = useAsync(async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) throw new errorHandle("Pin is required", 400);

        const label = await ModelLabel.findOne({ pin })
            .populate('product')
            .populate({ 
                path: 'batch',
                populate: { path: 'product' } 
            });

        if (label) {
             const MAX_VERIFICATIONS = 2;
             
             // Increment count
             label.verificationCount = (label.verificationCount || 0) + 1;
             label.isVerified = true;
             await label.save();

             // Check if it exceeds threshold
             if (label.verificationCount > MAX_VERIFICATIONS) {
                 return res.status(403).json(utils.JParser('Warning: Potential Counterfeit. This pin has exceeded the maximum verification limit.', false, {
                     product: label.product,
                     batch: label.batch,
                     verificationCount: label.verificationCount,
                     pin: label.pin,
                     isFlagged: true
                 }));
             }

             let message = 'Product is authentic';
             if (label.verificationCount > 1) {
                 message = `Product is authentic (Note: Previously verified ${label.verificationCount - 1} times)`;
             }

             return res.json(utils.JParser(message, true, {
                 product: label.product,
                 batch: label.batch,
                 verificationCount: label.verificationCount,
                 pin: label.pin,
                 isFlagged: false
             }));
        } else {
             return res.status(404).json(utils.JParser('Invalid Pin. Product not found.', false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.verifyLabel = useAsync(async (req, res) => {
    try {

        const form = new FormData();

        if (req.file) {
            form.append('image', fs.createReadStream(req.file.path), {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
        }

        const apiResponse = await axios.post(
            `${process.env.LABEL_BASE_URL}/verify`,
            form,
            { headers: form.getHeaders() }
        );

        if (apiResponse) {
            return res.json(utils.JParser('Label verify successfully ', true, apiResponse.data));

        } else {
            return res.status(400).json(utils.JParser('Unknown error occured', false, []));
        }
    } catch (e) {
        console.log(e);
        const status = e?.response?.status;
        const data = e?.response?.data;
        if (status === 404 && data && data.in_database === false) {
            return res.status(404).json(utils.JParser(data.error || 'Product not in database', false, data));
        }
        return res.status(status || 500).json(utils.JParser(e.message, false, []));
    }
});
