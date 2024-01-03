const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelAdmin = require("../models/model.admin");



exports.editAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID 
        const body = req.body

        if (!adminID)   return res.status(402).json(utils.JParser('provide the admin id', false, []));

        await ModelAdmin.updateOne({ _id: adminID }, body).then(async () => {
            const admin = await ModelAdmin.find({ _id: adminID });
            return res.json(utils.JParser('Admin Update Successfully', !!admin, admin));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        const admin = await ModelAdmin.findOne({ _id: adminID });
        return res.json(utils.JParser('Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.params.id
        const admin = await ModelAdmin.findOne({ _id: adminID });
        return res.json(utils.JParser('Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.allAdmin = useAsync(async (req, res) => {

    try {
        const admin = await ModelAdmin.find();
        return res.json(utils.JParser('All Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteAdmin = useAsync(async (req, res) => {
    try {
        const adminID = req.body.id
        if (!adminID)   return res.status(402).json(utils.JParser('provide the admin id', false, []));

        const admin = await ModelAdmin.deleteOne({ _id: adminID })
        return res.json(utils.JParser('Admin deleted successfully', !!admin, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});