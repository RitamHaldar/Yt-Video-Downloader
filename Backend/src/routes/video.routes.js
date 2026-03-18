const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');

router.get('/video-info', videoController.getVideoInfo);
router.get('/download', videoController.downloadVideo);

module.exports = router;
