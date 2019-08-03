const express = require('express')
const path = require('path')
const pool = require(path.resolve(__dirname,"../utils/db.js"))


const router = express.Router()
//1.添加路由接口
router.get('/api/categories',(req,res,next)=>{
//2.操作数据库获取数据
    pool.query('SELECT * FROM `ali_cate`',(err,ret)=>{
        if(err){
            next(err)
        }
        //3.把数据响应给客户端

        res.send({
            success:true,
            ret
        })
    })
})

module.exports = router