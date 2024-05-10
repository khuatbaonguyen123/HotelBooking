const express = require('express');
const router = express.Router();

const Rating = require('../model_mongodb/dbmongo.js');
const db = require('../database');

router.post('/rate', async (req, res) => {
    const ratings = req.body.rating;
    const comment = req.body.comment;
    console.log(ratings);
    console.log(comment);
});

module.exports = router;