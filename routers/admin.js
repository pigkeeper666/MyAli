const express = require('express')
const router = express.Router()
const pool = require('../utils/db.js')

router.get('/admin/categories',(req,res,next) =>{
    return res.render('admin/categories.html')
})

router.get('/admin/users',(req,res,next) =>{
    return res.render('admin/users.html')
})

router.get('/admin/login',(req,res,next) =>{
    return res.render('admin/login.html')
})

router.get('/admin/index',(req,res,next) =>{
    return res.render('admin/index.html')
})


module.exports = router