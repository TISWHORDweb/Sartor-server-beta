const dotenv = require("dotenv")
const fs = require('fs');
const path = require('path');
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const axios = require('axios');
const FormData = require('form-data');
const ModelLabel = require("../models/model.Label");
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
        // Validate required fields
        if (!req.body.label_id) {
            throw new errorHandle('label_id is required', 400);
        }

        const label = await ModelLabel.findById(req.body.label_id);
        if (label) {
            // Process external API upload
            const form = new FormData();
            if (req.body.batch_id) form.append('batch_id', req.body.batch_id);
            if (req.body.product_name) form.append('product_name', req.body.product_name);
            if (req.body.sku) form.append('sku', req.body.sku);
            if (req.file) {
                form.append('image', fs.createReadStream(req.file.path), {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
            }

            const apiResponse = await axios.post(
                `${process.env.LABEL_BASE_URL}/upload_label`,
                form,
                { headers: form.getHeaders() }
            );
            console.log("console.log " + apiResponse);


            if (apiResponse.data?.modified_images?.length > 0) {

                if (!label) throw new errorHandle('Label not found', 404);

                // Upload images sequentially to avoid rate limits
                for (const [index, image] of apiResponse.data.modified_images.entries()) {
                    if (image.modified_image) {
                        const tempPath = path.join('/tmp', `upload-${Date.now()}-${index}.jpg`);
                        fs.writeFileSync(tempPath, image.modified_image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                        tempFiles.push(tempPath);

                        try {
                            const url = await uploadToCloudinary(tempPath);
                            if (index === 0) label.image = url;
                            if (index === 1) label.subImage = url;
                        } finally {
                            // Clean up even if upload fails
                            fs.unlinkSync(tempPath);
                            tempFiles = tempFiles.filter(f => f !== tempPath);
                        }
                    }
                }

                await label.save();

                // Fire-and-forget training API
                axios.post(`${process.env.LABEL_BASE_URL}/train`, {
                    label_id: req.body.label_id
                }).catch(err => console.error('Training API failed (non-critical):', err));

                console.log("training")
            }

            return res.json(utils.JParser('Label processed successfully', true, {
                label_id: req.body.label_id,
                image_count: apiResponse.data?.modified_images?.length || 0
            }));
        } else {
            return res.status(400).json(utils.JParser('Label not found', false, []));
        }
    } catch (e) {
        console.log("newerror.  " + e);

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

        return res.status(500).json(utils.JParser(e.message, false, []));
    }
});