const express = require('express');
const router = express.Router();
const path = require('path');
const db=require('../database');
const bcrypt=require('bcrypt');

router.get('/',(req,res)=>{
    res.redirect('/index');
})

router.get('/index', (req, res) => {
    res.render('index.ejs', {message: req.flash('success')});
})

router.get('/rooms', (req, res) => {
    const query = "select distinct name, description, link, image, price_each_day from type t " + 
                  "join month_price m on t.id = m.type_id;"
    db.query(query, (err, data) => {
        if (err) throw err;
        else
            res.render('rooms.ejs', {data});
    })
})

router.get('/about', (req, res) => {
    res.render('about.ejs');
})


router.get('/contact', (req, res) => {
    res.render('contact.ejs');
})

router.get('/restaurant', (req, res) => {
    res.render('restaurant.ejs');
})

router.get('/spa', (req, res) => {
    res.render('spa.ejs');
})
router.get('/detail1', (req, res) => {
    res.render('detail1.ejs');
})
router.get('/detail2', (req, res) => {
    res.render('detail2.ejs');
})
router.get('/detail3', (req, res) => {
    res.render('detail3.ejs');
})
router.get('/detail4', (req, res) => {
    res.render('detail4.ejs');
})
router.get('/detail5', (req, res) => {
    res.render('detail5.ejs');
})
router.get('/detail6', (req, res) => {
    res.render('detail6.ejs');
})


router.get('/Assignment_r', (req, res) => {
    res.render('Assignment_r.ejs');
})
router.get('/Assignment_db', (req, res) => {
    res.render('Assignment_db.ejs');
})
router.get('/Assignment_s', (req, res) => {
    res.render('Assignment_s.ejs');
})


router.get('/Assignment_r2', (req, res) => {
    res.render('Assignment_r2.ejs');
})
router.get('/Assignment_db2', (req, res) => {
    res.render('Assignment_db2.ejs');
})
router.get('/Assignment_s2', (req, res) => {
    res.render('Assignment_s2.ejs');
})


router.get('/Assignment_r3', (req, res) => {
    res.render('Assignment_r3.ejs');
})
router.get('/Assignment_db3', (req, res) => {
    res.render('Assignment_db3.ejs');
})
router.get('/Assignment_s3', (req, res) => {
    res.render('Assignment_s3.ejs');
})


router.get('/Assignment_r4', (req, res) => {
    res.render('Assignment_r4.ejs');
})
router.get('/Assignment_db4', (req, res) => {
    res.render('Assignment_db4.ejs');
})
router.get('/Assignment_s4', (req, res) => {
    res.render('Assignment_s4.ejs');
})


router.get('/Assignment_r5', (req, res) => {
    res.render('Assignment_r5.ejs');
})
router.get('/Assignment_db5', (req, res) => {
    res.render('Assignment_db5.ejs');
})
router.get('/Assignment_s5', (req, res) => {
    res.render('Assignment_s5.ejs');
})


router.get('/Assignment_r6', (req, res) => {
    res.render('Assignment_r6.ejs');
})
router.get('/Assignment_db6', (req, res) => {
    res.render('Assignment_db6.ejs');
})
router.get('/Assignment_s6', (req, res) => {
    res.render('Assignment_s6.ejs');
})
module.exports = router