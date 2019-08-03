const mysql = require('mysql')

//创建一个连接池
const pool = mysql.createPool({
    connectionLimit:10, //限制连接数
    host:'localhost',
    user:'root',
    password:'123456',
    database:'alishow'
})

//把连接池导出，谁要用数据库，谁就加载db.js模块，拿到pool，使用query方法
module.exports = pool