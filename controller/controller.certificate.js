const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelPerson = require('../models/model.person');
const ModelCertificate = require('../models/model.certificate');



exports.editCertificates = useAsync(async (req, res) => {

    try {
        
        const id = req.body.id;
        const body = req.body
        await ModelCertificate.updateOne({ _id: id }, body).then(async () => {
            const certificate = await ModelCertificate.find({ _id: id });
            return res.json(utils.JParser('Certificate Update Successfully', !!certificate, certificate));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.certificate = useAsync(async (req, res) => {

    try{

        const certificate = await ModelCertificate.create(req.body)
        return res.json(utils.JParser('Certificate created successfully', !!certificate, certificate));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleCertificate = useAsync(async (req, res) => {

    try {
        const certificate = await ModelCertificate.findOne({ _id: req.params.id });
        return res.json(utils.JParser('Certificate fetch successfully', !!certificate, certificate));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allCertificate = useAsync(async (req, res) => {

    try {
        const certificate = await ModelCertificate.find();
        return res.json(utils.JParser('Certificate fetch successfully', !!certificate, certificate));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userCertificate= useAsync(async (req, res) => {

    try {
        const certificate = await ModelCertificate.find({ personId: req.params.id });
        return res.json(utils.JParser('User Certificate fetch successfully', !!certificate, certificate));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteCertificate = useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelCertificate.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('Certificate deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});
