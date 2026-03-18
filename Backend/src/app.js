const express = require('express');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./routes/video.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', videoRoutes);

module.exports = app;
