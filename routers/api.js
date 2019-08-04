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

router.get('/api/categories/delete',(req,res,next)=>{
    const {id} = req.query
    //防止sql注入
    pool.query('DELETE FROM `ali_cate` WHERE `cate_id`=?',[id],(err,ret)=>{
        if(err){
            return next(err)
        }
        res.send({
            success:true,
            ret
        })
    })
})

router.post('/api/categories/create',(req,res,next)=>{
    // 通过body-parser来获取表单的POST数据
    var body = req.body
    pool.query('INSERT INTO `ali_cate` SET `cate_name`=?, `cate_slug`=?',
    [body.cate_name,body.cate_slug],
    (err,ret) =>{ //ret虽然用不到，但是不能缺省参数
        if(err){
           return next(err)
        }
        // 发送响应 状态码200表示成功
        res.status(200).json({
            success:true
        })
    })
})

module.exports = router