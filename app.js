const express = require('express')
const path = require('path')
const router = require(path.join(__dirname,"routers/index.js"))
const adminRouter = require(path.join(__dirname,"routers/admin.js"))
const apiRouter = require(path.join(__dirname,"routers/api.js"))
const bodyParser = require('body-parser')
const app = express()



//开放静态资源
app.use('/public',express.static(path.join(__dirname,'./public')))

// res.render() 的时候默认去 views 中查找模板文件
app.set('views', path.join(__dirname, 'views'))

// express-art-template 内部依赖了 art-template
app.engine('html', require('express-art-template'))

// 配置body-parser parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// 配置body-parser parse application/json
app.use(bodyParser.json())

app.use(router)
app.use(adminRouter)
app.use(apiRouter)

app.use((err, req, res, next) => {
    // 1. 记录错误日志
    // 2. 一些比较严重的错误，还应该通知网站负责人或是开发人员等
    //    可以通过程序调用第三方服务，发短信，发邮件
    // 3. 把错误消息发送到客户端 500 Server Internal Error
    res.status(500).send({
      error: err.message
    })
  })


app.listen(3000,() => console.log('Server listening http://127.0.0.1:3000/'))
