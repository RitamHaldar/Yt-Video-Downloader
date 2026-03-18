const express = require('express');
const cors = require('cors');
const videoRoutes = require('./routes/video.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("../public"));

app.use('/', videoRoutes);

module.exports = app;
