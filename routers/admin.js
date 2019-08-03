const express = require('express')
const router = express.Router()
const pool = require('../utils/db.js')

router.get('/admin/categories',(req,res,next) =>{
    console.log('收到')
    return res.render('admin/categories.html')
})



module.exports = router