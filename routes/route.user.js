/**
 * 
 */
const {userBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const {  userSettings, singleUser, deleteUser,userHomeData, audit, singleAudit, deleteAudit, allUser, changePassword } = require('../controller/controller.user');
const { editCertificates, certificate, singleCertificate, allCertificate, userCertificate, deleteCertificate } = require('../controller/controller.certificate');
const { education, editEducation, singleEducation, allEducation, userEducation, deleteEducation } = require('../controller/controller.education');
const { editLanguage, language, singleLanguage, allLanguage, userLanguage, deleteLanguage } = require('../controller/controller.language');
const { editReference, reference, allReference, userReference, deleteReference, singleReference } = require('../controller/controller.reference');
const { editSkill, skill, singleSkill, allSkill, userSkill, deleteSkill } = require('../controller/controller.skill');
const { edithobby, hobby, singlehobby, allhobby, userhobby, deletehobby } = require('../controller/controller.hobby');

const { deleteWork, userWork, allWork, singleWork, work, editWork } = require('../controller/controller.work');

/**
 * auth routes
 */

router.put('/setting/:id', userSettings);
router.get('/single/:id', singleUser);
router.get('/users',userBodyGuard, allUser);
router.post('/change/password', changePassword);
router.delete('/delete', deleteUser);


//CERTIFICATE
router.put('/certificate/edit', editCertificates);
router.post('/certificate', certificate);
router.get('/certificate/:id', singleCertificate);
router.get('/certificate/all', allCertificate);
router.get('/certificate/user/:id', userCertificate);
router.delete('/certificate/deletes', deleteCertificate);

//Education
router.put('/education/edit', editEducation);
router.post('/education', education);
router.get('/education/:id', singleEducation);
router.get('/education/all', allEducation);
router.get('/education/user/:id', userEducation);
router.delete('/education/deletes', deleteEducation);

//Language
router.put('/language/edit', editLanguage);
router.post('/language', language);
router.get('/language/:id', singleLanguage);
router.get('/language/all', allLanguage);
router.get('/language/user/:id', userLanguage);
router.delete('/language/deletes', deleteLanguage);

//References
router.put('/reference/edit', editReference);
router.post('/reference', reference);
router.get('/reference/:id', singleReference);
router.get('/reference/all', allReference);
router.get('/reference/user/:id', userReference);
router.delete('/reference/deletes', deleteReference);

//Skill
router.put('/skill/edit', editSkill);
router.post('/skill', skill);
router.get('/skill/:id', singleSkill);
router.get('/skill/all', allSkill);
router.get('/skill/user/:id', userSkill);
router.delete('/skill/deletes', deleteSkill);

//Hobby
router.put('/hobby/edit', edithobby);
router.post('/hobby', hobby);
router.get('/hobby/:id', singlehobby);
router.get('/hobby/all', allhobby);
router.get('/hobby/user/:id', userhobby);
router.delete('/hobby/deletes', deletehobby);

//Work
router.put('/work/edit', editWork);
router.post('/work', work);
router.get('/work/:id', singleWork);
router.get('/work/all', allWork);
router.get('/work/user/:id', userWork);
router.delete('/work/deletes', deleteWork);

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
