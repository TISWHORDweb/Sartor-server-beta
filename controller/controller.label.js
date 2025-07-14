const dotenv = require("dotenv")
const fs = require('fs');
const path = require('path');
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const axios = require('axios');
const FormData = require('form-data');
const ModelLabel = require("../models/model.Label");

exports.uploadLabel = useAsync(async (req, res) => {
    try {
        if (!req.body.batch_id || !req.body.product_name || !req.body.sku) {
            return res.status(400).json(utils.JParser('Required fields missing', false, []));
        }

        if (req.file) {
            if (!fs.existsSync(req.file.path)) {
                throw new Error('Uploaded file not found');
            }
        }

        const form = new FormData();
        form.append('batch_id', req.body.batch_id);
        form.append('product_name', req.body.product_name);
        form.append('sku', req.body.sku);

        if (req.file) {
            form.append('images', fs.createReadStream(req.file.path), {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
        }

        const apiResponse = await axios.post(`${process.env.LABEL_BASE_URL}/api/upload-labels`, form, {
            headers: {
                ...form.getHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        });

        if (apiResponse.data && apiResponse.data.modified_images &&
            apiResponse.data.modified_images.length > 0) {

            const modifiedImages = apiResponse.data.modified_images;

            for (const image of modifiedImages) {
                if (image.modified_image) {
                    const base64Data = image.modified_image.replace(/^data:image\/\w+;base64,/, '');

                    const extension = image.filename.split('.').pop() || 'jpg';
                    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
                    const filePath = path.join('modified', filename);

                    if (!fs.existsSync('modified')) {
                        fs.mkdirSync('modified');
                    }

                    fs.writeFileSync(filePath, base64Data, 'base64');

                    apiResponse.data.saved_images = apiResponse.data.saved_images || [];
                    apiResponse.data.saved_images.push({
                        filename: filename,
                        path: filePath,
                        original_name: image.filename
                    });
                    console.log(filename+" saved");
                    
                }
            }
        }

        return res.json(utils.JParser('Label uploaded', true, apiResponse.data));

    } catch (e) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Full error:', e);
        return res.status(500).json(
            utils.JParser(e.response?.data?.message || e.message || 'Upload failed', false, [])
        );
    }
});


exports.labelTrainWebhook = useAsync(async (req, res) => {
    try {

        const token = req.headers['s-token'];

         if (token !== process.env.WEBHOOK_TOKEN) {
            return res.status(404).json(utils.JParser('Invalid token', false, []));
        }

        const schema = Joi.object({
            lead_id: Joi.string().required(),
            status: Joi.string().required(),
        });

        const validator = await schema.validateAsync(req.body);
        const id = validator.lead_id
        const label = await ModelLabel.findByIdAndUpdate(id, validator, { new: true });

        if (!label) {
            return res.status(404).json(utils.JParser('label not found', false, []));
        }

        return res.json(utils.JParser('Received', true, []));

    } catch (e) {
       throw new errorHandle(e.message, 500);
    }
});
