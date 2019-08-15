const express = require('express')
const path = require('path')
const router = require(path.join(__dirname,"routers/index.js"))
const adminRouter = require(path.join(__dirname,"routers/admin.js"))
const apiRouter = require(path.join(__dirname,"routers/api.js"))
const bodyParser = require('body-parser')
const session = require('express-session')
const checkLogin = require('./middlewares/check-login.js')

/**
 * 配置 Session 数据持久化
 * 参考文档：https://github.com/chill117/express-mysql-session#readme
 * 该插件会自动往数据库中创建一个 sessions 表，用来存储 Session 数据
 */

const MySQLStore = require('express-mysql-session')(session)

const sessionStore = new MySQLStore({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'alishow'
})


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

app.use(session({
  // 生成密文是有一套算法的来计算生成密文，如果网站都使用默认的密文生成方式， 就会有一定的重复和被破解的概率，所以为了增加这个安全性，算法对外暴露了一个混入私钥的接口，算法在生成密文的时候会混入我们添加的自定义成分
  secret: 'keyboard cat',
  resave: false,
  // 如果为 true 无论是否往 Session 中存储数据，都直接给客户端发送一个 Cookie 小票
  // 如果为 false，则只有在往 Session 中写入数据的时候才会下发小票
  // 推荐设置为 true
  saveUninitialized: true,
  // 告诉 express-session 中间件，使用 sessionStore 持久化 Session 数据
  store: sessionStore
}))

/**
 * 统一控制后台管理系统的页面访问权限
 * 相当于为所有以 /admin/xxxxx 开头的请求设置了一道关卡
 * 
 */
// app.use('/admin', checkLogin)
app.use('/admin', checkLogin, (req, res, next) => { // 只有在 checkLogin 中 next 了，才会执行这个中间件
  app.locals.sessionUser = req.session.user
  next()
})

app.use(router)
app.use(adminRouter)
app.use(apiRouter)

// 注意 有四个参数 不能漏
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
