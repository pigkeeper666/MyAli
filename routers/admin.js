const express = require('express')
const router = express.Router()
const pool = require('../utils/db.js')

router.get('/admin/categories',(req,res,next) =>{
    return res.render('admin/categories.html')
})

router.get('/admin/users',(req,res,next) =>{
    return res.render('admin/users.html')
})


module.exports = router