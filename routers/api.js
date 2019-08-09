const express = require('express')
const path = require('path')
const pool = require(path.resolve(__dirname,"../utils/db.js"))


const router = express.Router()

// 以下是分类页面的
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

router.get('/api/categories/getSingleData',(req,res,next)=>{
    const {id} = req.query
    pool.query('SELECT * FROM `ali_cate` WHERE `cate_id` =?',[id],(err,ret)=>{
        if(err){
            return next(err)
        }
        res.send({
            success:true,
            ret
        })
    })
})

router.post('/api/categories/update',(req,res,next)=>{
    var body = req.body
    pool.query('UPDATE `ali_cate` SET `cate_name` =? ,`cate_slug`=? WHERE `cate_id`=?',
    [body.cate_name,body.cate_slug,body.cate_id],
    (err,ret)=>{
        if(err){
            return next(err)
        }
        res.status(200).json({
            success:true
        })
    })
})


//  以下是用户管理页面的
// 渲染列表
router.get('/api/users',(req,res,next)=>{
    pool.query('SELECT * FROM `ali_admin`',(err,ret)=>{
        if(err){
            return next(err)
        }
        res.send({
            success:true,
            ret
        })
    })
})

// 检查邮箱
router.get('/api/users/checkemail',(req,res,next)=>{
    const email = req.query.admin_email
    pool.query('SELECT `admin_email` FROM `ali_admin` WHERE `admin_email` =?',[email],(err,ret)=>{
        if(err){
           return next(err)
        }
        // 只要检验ret数组的长度即可知道是否数据库中有该数据了
        // 只需要返回一个布尔值
        if(ret.length == 0){
            // 用户名不存在
            return res.send(true)
        }else{
            return res.send(false)
        }
    })
})

// 添加用户
router.post('/api/user/create',(req,res,next)=>{
    body = req.body
    pool.query('INSERT INTO `ali_admin` SET `admin_email`=?, `admin_slug` = ? , `admin_nickname`= ? , `admin_pwd` = ? ',
    [body.admin_email,body.admin_slug,body.admin_nickname,body.admin_pwd],
    (err,ret)=>{
        if(err){
            return next(err)
        }
        res.status(200).json({
            success:true
        })
    })
})

// 删除用户
router.get('/api/user/delete',(req,res,next)=>{
    const id = req.query.id
    pool.query('DELETE FROM `ali_admin` WHERE `admin_id` = ?',[id],(err,ret)=>{
        if(err){
            console.log('db')
            return next(err)
        }
        res.status(200).json({
            success:true
        })
    })

})

// 编辑用户——渲染模态框数据
router.get('/api/user/getSingleData',(req,res,next)=>{
    const id =req.query.id
    pool.query('SELECT * FROM `ali_admin` WHERE `admin_id`=?',[id],(err,ret)=>{
        if(err){
            return next(err)
        }
        res.send({
            success:true,
            ret
        })
    })
})

// 编辑用户——更新数据
router.post('/api/user/update',(req,res,next)=>{
    const body = req.body
    pool.query('UPDATE `ali_admin` SET `admin_email`=?,admin_slug=?,admin_nickname=?,admin_pwd=? WHERE admin_id = ?',
    [body.admin_email,body.admin_slug,body.admin_nickname,body.admin_pwd,body.admin_id],
    (err,ret)=>{
        if(err){
            return next(err)
        }
        res.status(200).json({
            success:true
        })
    })
    
})
module.exports = router