const express = require('express')
const router = express.Router()

router.get('/',(req,res) => {
    res.render('index.html')
})

router.get('/list',(req,res) => {
    res.render('list.html')
})

router.get('/detail',(req,res) => {
    res.render('detail.html')
})

module.exports = router