const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');



exports.editEducation = useAsync(async (req, res) => {

    try {

        const id = req.body.id;
        const body = req.body
        await ModelEducation.updateOne({ _id: id }, body).then(async () => {
            const education = await ModelEducation.find({ _id: id });
            return res.json(utils.JParser('Education Update Successfully', !!education, education));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.product = useAsync(async (req, res) => {

    try {

        const aid = req.adminID 

        //create data if all data available
        const schema = Joi.object({
            productName: Joi.required(),
            productID: Joi.required(),
            category: Joi.required(),
            buyingPrice: Joi.required(),
            quantity: Joi.required(),
            unit: Joi.required(),
            expiryDate: Joi.required(),
            productImage: Joi.required(),
            sellingPrice: Joi.required()
        })

        //capture data
        const { productName, productID, category, buyingPrice, quantity, unit, expiryDate,productImage, sellingPrice} = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.adminID = aid

        const education = await ModelEducation.create(req.body)
        return res.json(utils.JParser('Education created successfully', !!education, education));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleEducation = useAsync(async (req, res) => {

    try {
        const education = await ModelEducation.findOne({ _id: req.params.id });
        return res.json(utils.JParser('Education fetch successfully', !!education, education));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allEducation = useAsync(async (req, res) => {

    try {
        const education = await ModelEducation.find();
        return res.json(utils.JParser('Education fetch successfully', !!education, education));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userEducation = useAsync(async (req, res) => {

    try {
        const education = await ModelEducation.find({ personId: req.params.id });
        return res.json(utils.JParser('User Education fetch successfully', !!education, education));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteEducation = useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelEducation.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('Education deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});