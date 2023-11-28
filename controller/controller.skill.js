const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelPerson = require('../models/model.person');
const ModelSkill = require('../models/model.skill');



exports.editSkill = useAsync(async (req, res) => {

    try {
        
        const id = req.body.id;
        const body = req.body
        await ModelSkill.updateOne({ _id: id }, body).then(async () => {
            const skill = await ModelSkill.find({ _id: id });
            return res.json(utils.JParser('Skill Update Successfully', !!skill, skill));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.skill = useAsync(async (req, res) => {

    try{

        const skill = await ModelSkill.create(req.body)
        return res.json(utils.JParser('Skill created successfully', !!skill, skill));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleSkill= useAsync(async (req, res) => {

    try {
        const skill = await ModelSkill.findOne({ _id: req.params.id });
        return res.json(utils.JParser('Skill fetch successfully', !!skill, skill));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allSkill = useAsync(async (req, res) => {

    try {
        const skill = await ModelSkill.find();
        return res.json(utils.JParser('Skill fetch successfully', !!skill, skill));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userSkill= useAsync(async (req, res) => {

    try {
        const skill = await ModelSkill.find({ personId: req.params.id });
        return res.json(utils.JParser('User Skill fetch successfully', !!skill, skill));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteSkill = useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelSkill.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('Skill deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});