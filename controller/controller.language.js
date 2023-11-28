const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelPerson = require('../models/model.person');
const ModelLanguage = require('../models/model.language');



exports.editLanguage = useAsync(async (req, res) => {

    try {
        
        const id = req.body.id;
        const body = req.body
        await ModelLanguage.updateOne({ _id: id }, body).then(async () => {
            const language = await ModelLanguage.find({ _id: id });
            return res.json(utils.JParser('Language Update Successfully', !!language, language));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.language = useAsync(async (req, res) => {

    try{

        const language = await ModelLanguage.create(req.body)
        return res.json(utils.JParser('Language created successfully', !!language, language));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleLanguage= useAsync(async (req, res) => {

    try {
        const language = await ModelLanguage.findOne({ _id: req.params.id });
        return res.json(utils.JParser('Language fetch successfully', !!language, language));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allLanguage = useAsync(async (req, res) => {

    try {
        const language = await ModelLanguage.find();
        return res.json(utils.JParser('Language fetch successfully', !!language, language));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userLanguage= useAsync(async (req, res) => {

    try {
        const language = await ModelLanguage.find({ personId: req.params.id });
        return res.json(utils.JParser('User Language fetch successfully', !!language, language));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteLanguage = useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelLanguage.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('Language deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});