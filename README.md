# MyAli

# 第一天的主要工作

1. 初始化项目的目录结构

   + node_modules 第三方包存储目录（使用npm装包时默认生成）
   + controllers 控制器
   + public 静态资源（image，css，客户端js....）
   + views 视图（存储HTML视图文件）
   + app.js 应用程序启动入口 （加载Express，启动HTTP服务...）
   + config.js 应用配置文件(把经常需要改动的数据放到配置文件中，便于修改)
   + utils 存储工具模块（比如说用来操作数据库的木块）
   + middlewares 放置自定义中间件
   + routers 存储路由相关模块
   + package.json 项目包说明文件，存储项目名称，第三方包依赖等信息（npm init）
   + package-lock.json npm产生的包说明文件
   + README.md 项目说明文件

   

2. 安装Express、模板引擎、开放静态资源

3. 提取路由

4. 下载MySQL，学习MySQL的基本使用

# 第二天的主要工作

### 1. 连接数据库

配置`ustil/db.js`文件

```javascript
const mysql = require('mysql')

//创建一个连接池
const pool = mysql.createPool({
    connectionLimit:10, //限制连接数
    host:'localhost',
    user:'root',
    password:'123456',
    database:'test'
})

//把连接池导出，谁要用数据库，谁就加载db.js模块，拿到pool，使用query方法
module.exports = pool
```

在测试中，发现程序无法连接上数据库，并报以下错误：

`Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server; consider upgrading MySQL client`

在CSDN上查询，得到以下解决方法



>**MySQL8.0版本的加密方式和MySQL5.0的不一样，连接会报错。** 
>解决方法如下：
>
>1. 通过命令行进入解压的mysql根目录下。
>2. 登陆数据库 
>   `mysql -uroot -p`
>3. 输入root的密码 
>   `Enter password: ******`
>4. 更改加密方式 
>   `mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'password' PASSWORD EXPIRE NEVER;`
>5. 更改密码：该例子中 123456为新密码 
>   `mysql> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';`
>6. 刷新： 
>   `mysql> FLUSH PRIVILEGES;`



更改完密码，并更新`utils/db.js`文件中的密码后，便可以正确连接



### 2.服务端全局错误处理

在路由挂载之后，添加以下代码

```javascript
app.use((err, req, res, next) => {
  // 1. 记录错误日志
  // 2. 一些比较严重的错误，还应该通知网站负责人或是开发人员等
  //    可以通过程序调用第三方服务，发短信，发邮件
  // 3. 把错误消息发送到客户端 500 Server Internal Error
  res.status(500).send({
    error: err.message
  })
})
```

然后在我们的路由处理中，如果有错误，就调用 next 函数传递错误对象，例如

```javascript
router.get('xxx', (req, res, next) => {
  xxx操作
  if (err) {
    // 调用 next，传递 err 错误对象
    return next(err)
  }
})
```



### 3.开始制作分类页面

#### 分类管理

主要的视图html文件是，`views/admin/categories.html` 

最后渲染出来的应该如下图

![1564840742191](C:\Users\65340\AppData\Roaming\Typora\typora-user-images\1564840742191.png)

分析一下我们要做的事（默认之前路由已经设计完毕）：

1. 加载至该页面，页面发出ajax请求（get），请求一个接口` /api/categories` 获取分类列表数据，等待响应

   categories.html

   ```javascript
     function loadList() {
       $.ajax({
          //请求接口
         url: '/api/categories',
         dataType: 'json',
         success: function(result) {
         	// 返回数据后，执行的回调函数
         },
         error:function(err){
        	// 返回数据后，执行的回调函数
         }
       })
     }
   ```

2. 服务器响应该数据 ` /api/categories`,查询数据库将值返回

   api.js

   ```javascript
   ...
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
               ret //这个就是数据
           })
       })
   })
   ...
   ```

   

3. 客户端收到服务器响应的数据，结合回调函数和数据，利用模板引擎渲染页面

   此时，我们只要把步骤1中的回调函数填写完即可

   categories.html

   ```javascript
   <script>
     loadList()
   
     function loadList() {
       $.ajax({
         url: '/api/categories',
         dataType: 'json',
         success: function(result) {
           if(result.success){
             // 调用template方法生成html代码片段
             var htmlStr = template('list_template', { 
              listData: result.ret 
             })
             // 渲染
              $('#list_container').html(htmlStr)
            }
         },
         error:function(err){
           console.log('请求失败！！！')
         }
       })
     }
   </script>
   ```

   在执行成功的回调函数中，我们看到使用了模板，因而我们在文件中添加模板字符串

   categories.html

   ```javascript
   <!-- 模板字符串 -->
   <script type="text/html" id="list_template">
     {%each listData%}
     <tr>
       <td class="text-center"><input type="checkbox"></td>
       <td>{% $value.cate_name %}</td>
       <td>{% $value.cate_slug %}</td>
       <td class="text-center">
         <a href="javascript:;" class="btn btn-info btn-xs">编辑</a>
         <a data-id="{% $value.cate_id %}" name="delete" href="javascript:;" class="btn btn-danger btn-xs">删除</a>
       </td>
     </tr>
     {%/each%}
   </script>
   ```

   在art-template插件中，有两种语法，一种是 {{ }} 还有一种是 {% %}

   > 注意：如果一个html文件中，既存在客户端渲染，也存在服务端渲染的话，那么这两种渲染的模板引擎语法不能一致，否则在加载时服务端渲染就已经将客户端的模板也一并渲染了！！！
   >
   > 一般遇到这种情况，例如一个html文件中既有服务端渲染又有客户端渲染的情况下，服务端的模板引擎我们使用`{{ }}`语法，客户端渲染我们使用`<%= %>`

   

   链接：https://blog.csdn.net/u013263917/article/details/78450780

   因此，在模板字符串中，我使用了{%%}，因为怕服务端进行渲染。事实证明，如果我用{{}}，页面会报错，同时就算注释里有这个语法

   这里留一个问题：修改模板引擎的语法界定符是什么？

   