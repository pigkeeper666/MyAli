const express = require('express')
const router = express.Router()
const pool = require('../utils/db.js')

router.get('/',(req,res,next) => {
    pool.query('SELECT * FROM ali_admin',(err,ret) =>{
        if(err){
        // 调用 next，传递 err 错误对象
         return next(err)
        } 

        return res.render('index.html')
    }) 
})

router.get('/list',(req,res,next) => {
    return res.render('list.html')
})

router.get('/detail',(req,res) => {
    return res.render('detail.html')
})

module.exports = router