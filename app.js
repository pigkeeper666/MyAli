const express = require('express')
const path = require('path')
const router = require(path.join(__dirname,"routers"))

const app = express()



//开放静态资源
app.use('/public',express.static(path.join(__dirname,'./public')))

// res.render() 的时候默认去 views 中查找模板文件
app.set('views', path.join(__dirname, 'views'))

// express-art-template 内部依赖了 art-template
app.engine('html', require('express-art-template'))

app.use(router)




app.listen(3000,() => console.log('Server listening http://127.0.0.1:3000/'))
