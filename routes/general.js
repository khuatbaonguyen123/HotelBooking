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
    res.render('rooms.ejs');
})

router.get('/about', (req, res) => {
    res.render('about.ejs');
})


router.get('/contact', (req, res) => {
    res.render('contact.ejs');
})

router.get('/chat', (req, res) => {
    res.render('chat.ejs');
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



module.exports = router