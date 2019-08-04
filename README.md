# MyAli

# 前置工作

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

# 正式开始

## 连接数据库

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



## 服务端全局错误处理

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



## 开始制作分类页面

### 分类列表

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

   在art-template插件中，有两种语法，一种是 {{ }} 还有一种是 <% %>

   > 注意：如果一个html文件中，既存在客户端渲染，也存在服务端渲染的话，那么这两种渲染的模板引擎语法不能一致，否则在加载时服务端渲染就已经将客户端的模板也一并渲染了！！！
   >
   > 一般遇到这种情况，例如一个html文件中既有服务端渲染又有客户端渲染的情况下，服务端的模板引擎我们使用`{{ }}`语法，客户端渲染我们使用`<%= %>`

   

   链接：https://blog.csdn.net/u013263917/article/details/78450780

   但是，在模板字符串中，我使用了{%%}，因为怕服务端进行渲染。事实证明，如果我用{{}}，页面会报错。

   事实上，我可以自定义模板解析规则

   ```javascript
   <script>
     // template('script 节点 id')
     // 当前页面是由服务端渲染出来的
     // 服务端先先对当前页面进行模板引擎处理
     // 服务端处理的时候根本不关心你的内容，只关心模板语法，我要解析替换
     // 当你的服务端模板引擎语法和客户端模板引擎语法一样的时候，就会产生冲突
     //    服务端会把客户端的模板字符串页给解析掉
     //    这就是所谓的前后端模板语法冲突
     template.defaults.rules[1].test = /{%([@#]?)[ \t]*(\/?)([\w\W]*?)[ \t]*%}/;
   </script>
   ```

   参照,所以{% %}这个是自定义的语法！

   ```javascript
   // 原始语法的界定符规则
   template.defaults.rules[0].test = /<%(#?)((?:==|=#|[=-])?)[ \t]*([\w\W]*?)[ \t]*(-?)%>/;
   // 标准语法的界定符规则
   template.defaults.rules[1].test = /{{([@#]?)[ \t]*(\/?)([\w\W]*?)[ \t]*}}/;
   ```




### 删除分类

我们需要达到的目标是：点击列表中的删除键，该行就会消失。运用ajax技术

1. 首先，我们要通过Jquery的`事件委托`为动态渲染出来的按钮添加事件

   > 事件委托就是利用冒泡的原理，把事件加到父元素或祖先元素上，触发执行效果。
   >
   > 当页面同步加载时，会添加事件。有时数据是由异步加载，同步无法给**不存在（刚开始）**的元素添加事件。此时我们可以在一开始就存在的**父元素**上添加事件，再通过父元素在触发时找子元素。

   

   categories.html

   ```javascript
   // JQuery事件委托实现删除
     // 当你点击删除按钮时，添加事件
     // list_container是父元素，在父元素下寻找一个a标签，他有个属性叫delete
     // 找到这个a标签后，为其添加点击事件，回调函数为handleDelete
     $('#list_container').on('click','a[name=delete]',handleDelete)
   ```

   即以下标签

   ```html
   <a data-id="{% $value.cate_id %}" name="delete" href="javascript:;" class="btn btn-danger btn-xs">删除</a>
   ```

   

 2. 点击删除后，发送ajax请求。此步即写出handleDelete函数

    categories.html

    ```javascript
    function handleDelete(){
        if(!window.confirm('确定删除吗？')){
          return
        }
        // data-* 用法
        const {id} = $(this).data(id)
        $.ajax({
            url:'api/categories/delete',
            method:'GET',
            data:{
                id:id
            },
            dataType:'json',
            success:function(result){
            // 删除成功，重新载入页面
      		},
            error:function(err){
             // 删除失败，错误处理
            }
        })
    }
    ```

    

    >注意：观察这个上面的a标签，第一个属性为 `data-id` ，这是一种`data-*`用法
    >
    >Jquery中` $(selector).data(name) `用法可以从元素中返回数据
    >
    >| 参数   | 描述                                                         |
    >| :----- | :----------------------------------------------------------- |
    >| *name* | 可选。规定要取回的数据的名称。如果没有规定名称，则该方法将以对象的形式从元素中返回所有存储的数据。 |
    >
    >倘若a标签里还有一个属性叫做`data-time`,那么如果我使用`$(this).data(time)`,即可拿到这个属性

    

3. 在服务端添加这个接口

   ```javascript
   router.get('/api/categories/delete',(req,res,next)=>{
       const {id} = req.query
       //防止sql注入
       pool.query('DELETE FROM `ali_cate` WHERE `cate_id`=?',[id],(err,ret)=>{
           if(err){
               next(err)
           }
           res.send({
               success:true,
               ret
           })
       })
   })
   ```

   

   > *SQL 注入*
   >
   >  在写 SQL 语句的时间尽量不要使用 SQL 拼装，因为很容易被 `SQL注入`，从而引发安全问题，如果数据和 SQL 语句需要分离，那么请使用 `占位符` 的方式。
   >
   > ```javascript
   > connection.query("select * from users where id = ? and name = ?", [1, 'jmjc'], (err, result)=>{}) // 这种方式 mysql 模块内部会调用 escape 方法，过滤掉一些非法的操作
   > 
   > /*
   >   当前我们也可以自己使用 escape 方法
   > */
   > connection.query('select * from users where id = ' + connection.escape(userId), (err, result) => {})
   > 
   > /*
   >  或者 format 方法
   > */
   > const sql = "select * from ?? where ?? = ?"
   > const inserts = ['users', 'id', 1]
   > sql = mysql.format(sql, inserts) // select * from users where id = 1
   > ```
   >
   > 

4. 完善ajax的回调函数

   ```javascript
   $('#list_container').on('click','a[name=delete]',handleDelete)
   
     function handleDelete(){
       //如果点了否，则不删除
       if(!window.confirm('确定删除吗？')){
         return
       }
       // data-* 用法
       var id = $(this).data('id')
       //如果点了确定，则发送Ajax请求，进行删除
       $.ajax({
         url:'/api/categories/delete',
         method:'GET',
         data:{
           id:id
         },
         dataType:'json',
         success:function(result){
           if(result.success){
             //如果删除成功，则重新渲染页面
             loadList()
           }
         },
         error:function(err){
           console.log('错误',err)
         }
       })
     }
   ```

   

### 添加分类

1. 客户端提交表单，发出添加请求

   同上的方法，只不过这次是注册了`submit`方法

   对于提交上来的表单，通过`$().serialize()`方法，把所有name都会拼接成固定的格式

   ```javascript
    // 添加分类
     $('#add_form').on('submit',handleAdd)
   
   function handleAdd(){
     // serialize 会找到表单中所有的带有 name 的表单元素，提取对应的值，拼接成 key=value&key=value... 的格式数据
     var formData = $('#add_form').serialize()
   
     $.ajax({
       url:'api/categories/create',
       method:'POST',
       data:formData,
       // Content-Type 为 application/x-www-form-urlencoded
       // data: { // data 为对象只是为了让你写起来方便，最终在发送给服务器的时候，$.ajax 还会把对象转换为 key=value&key=value... 的数据格式
       // 普通的表单 POST 提交（没有文件），必须提交格式为 key=value&key=value... 数据，放到请求体中
       //   key: value,
       //   key2: value2
       // },
       dataType:'json',
       success: function (result) {
         // 重新渲染列表
         // 清空表单
       },
       error: function (error) {
         // 失败
       }
     })
     return false
   }
   
   ```

   

2. 服务端处理`api/categories/create`接口，完成数据添加并响应

   + 接受POST请求，解析表单需要用到`body-parser`参考 [body-parser](https://github.com/expressjs/body-parser) 文档进行配置。
   + 操作数据库

   

   ```javascript
   router.post('/api/categories/create',(req,res,next)=>{
       // 通过body-parser来获取表单的POST数据
       var body = req.body
       // 防止SQL注入
       pool.query('INSERT INTO `ali_cate` SET `cate_name`=?, `cate_slug`=?',
       [body.cate_name,body.cate_slug],
       (err,ret) =>{ //ret虽然用不到，但是不能缺省参数
           if(err){
              console.log('database error')
              return next(err)
           }
           // 发送响应 状态码200表示成功
           res.status(200).json({
               success:true
           })
       })
   })
   ```

   

   > 注意：body-parser只用于POST请求
   >
   > 在POST请求中，使用的是`req.body`
   >
   > 在GET请求中，使用的是`req.query`
   >
   > 该数据库操作虽然用不到ret，但是一定要写上`(err,ret)=>{}`
   
   
   
   3. 客户端收到响应，完成回调函数
   
      ```javascript
        // 添加分类
        $('#add_form').on('submit',handleAdd)
      
      function handleAdd(){
        var formData = $('#add_form').serialize()
      
        $.ajax({
          url:'api/categories/create',
          method:'POST',
          data:formData,
          dataType:'json',
          success: function (result) {
            // 重新渲染列表
            if(result.success){
              loadList()
            }
            // 清空表单
            $('#add_form').find('input[name]').val('')
          },
          error: function (error) {
            console.log(error)
          }
        })
        return false
      }
      ```
   
      

