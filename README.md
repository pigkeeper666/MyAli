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

在路由挂载之后，添加以下代码。一定要在路由挂载后面！

```javascript
// 注意 四个参数缺一不可
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

当`next()`函数里面有参数时，直接会进去上面那个有四个形参的方法中，进行错误处理。

## 分类管理页面

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
            url:'/api/categories/delete',
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
       url:'/api/categories/create',
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
          url:'/api/categories/create',
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
   
      

### 编辑分类

这个功能稍微有点难

想要实现的功能是：点击了列表中的`编辑`按钮后，跳出一个`模态框`，其中也有一个表单，修改完毕后，重新渲染列表。所有的都使用ajax方式

首先来讲一下`模态框`

> 模态框就是一个弹出窗口
>
> ## 方法
>
> 下面是一些可与 modal() 一起使用的有用的方法。
>
> | 方法                         | 描述                                           | 实例                                          |
> | :--------------------------- | :--------------------------------------------- | :-------------------------------------------- |
> | **Options:** .modal(options) | 把内容作为模态框激活。接受一个可选的选项对象。 | `$('#identifier').modal({ keyboard: false })` |
> | **Toggle:** .modal('toggle') | 手动切换模态框。                               | `$('#identifier').modal('toggle')`            |
> | **Show:** .modal('show')     | 手动打开模态框。                               | `$('#identifier').modal('show')`              |
> | **Hide:** .modal('hide')     | 手动隐藏模态框。                               | `$('#identifier').modal('hide')`              |

接下来正式开始

1. 点击`编辑`按钮，弹出`模态框` 

   在html中，我们需要编辑模态框的结构。里面需要有一个表单。

   ```html
    <!-- 修改模态框 -->
     <div
       class="modal fade"
       id="editCateModalId"
       tabindex="-1"
       role="dialog"
       aria-labelledby="exampleModalLabel"
     >
       <div class="modal-dialog" role="document">
         <div class="modal-content">
           <div class="modal-header">
             <button
               type="button"
               class="close"
               data-dismiss="modal"
               aria-label="Close"
             >
               <span aria-hidden="true">&times;</span>
             </button>
             <h4 class="modal-title" id="exampleModalLabel">修改分类</h4>
           </div>
           <div class="modal-body">
             <form id="edit-form"> </form>
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-default" data-dismiss="modal">
               关闭
             </button>
             <button type="submit" id="editId" class="btn btn-primary">
               修改
             </button>
           </div>
         </div>
       </div>
     </div>
   ```

注意，其中有一个`form`表单标签，这是用于渲染待修改的数据的，也就是说这里会用模板引擎渲染

2. 当点击`修改`按钮的时候，发送ajax请求，请求原数据(通过id来索引)

   ```javascript
     //编辑分类之弹出模态框渲染原始数据
     $('#list_container').on('click','a[name=edit]',handleEditRender)
     // 首先要先请求服务器把这个信息传回来
     function handleEditRender(){
         //data-*
       var id = $(this).data('id')
       $.ajax({
         url:'/api/categories/getSingleData',
         method:'GET',
         data:{
           id:id
           },
         dataType:'json',
         success:function(result){
          // 利用模板引擎和模板字符串渲染页面
         }
       })
     }
   ```

   编辑模板字符串

   ```html
   <!-- 模板字符串 -->
   <script type='text/html' id='modal_template'>
     {% each data %}
     <div class="form-group">
         <!-- 表单隐藏域 -->
         <input type="hidden" name="cate_id" value="{% $value.cate_id %}">
         <label for="name">名称</label>
         <input
           class="form-control"
           name="cate_name"
           type="text"
           placeholder="分类名称"
           value="{% $value.cate_name %}"
         />
       </div>
       <div class="form-group">
         <label for="slug">别名</label>
         <input
           class="form-control"
           name="cate_slug"
           type="text"
           placeholder="slug"
           value="{% $value.cate_slug %}"
         />
         {% /each %}
   </script>
   ```



2. 服务端响应（通过id索引）

   ```javascript
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
   ```

   

3. 客户端收到服务端响应，完善回调

   ```javascript
     //编辑分类之弹出模态框渲染原始数据
     $('#list_container').on('click','a[name=edit]',handleEditRender)
     // 首先要先请求服务器把这个信息传回来
     function handleEditRender(){
       var id = $(this).data('id')
       $.ajax({
         url:'/api/categories/getSingleData',
         method:'GET',
         data:{
           id:id
           },
         dataType:'json',
         success:function(result){
           if(result.success){
           var htmlStr = template('modal_template',{
             data:result.ret
           })
           $('#edit-form').html(htmlStr)
           // 显示模态框
           $('#editCateModalId').modal('show')
         }
         }
       })
     }
   ```

   至此，点击`修改`，弹出的模态框已经有了原始数据。接下来我们将修改数据，点击`修改`按钮，进行表单提交

   

4. 注册表单的提交事件

   观察模态框的结构，提交按钮并不在表单里面

   正常情况下，按钮在表单里，只要监听`submit()`方法即可

   但是现在按钮在外面，故只要监听`click()`方法

   本质上我们并不是想要submit，我们只是想要submit的数据

   ```javascript
   //编辑分类之提交模态框的表单
     // 本来的思路是按钮在表单里，只要监听submit事件，然后将提交的字符串进行处理即可
     // 现在由于按钮在表单里，故监听click事件即可
     $('#editId').on('click',handleSubmit)
   
     function handleSubmit(){
         // 获取表单数据
       var formData = $('#edit-form').serialize()
     }
   ```

   

5. 发送 Ajax `POST`请求 `/api/categories/update`

   ```javascript
   //编辑分类之提交模态框的表单
     // 本来的思路是按钮在表单里，只要监听submit事件，然后将提交的字符串进行处理即可
     // 现在由于按钮在表单里，故监听click事件即可
     $('#editId').on('click',handleSubmit)
   
     function handleSubmit(){
       var formData = $('#edit-form').serialize()
       $.ajax({
         url:'/api/categories/update',
         method:'POST',
         data:formData,
         dataType:'json',
         success:function(result){
           if(result.success)
             //关闭模态框
             //重新渲染列表     
         },
         error:function(err){
           // 错误处理
         }
       })
       
     }
   ```

   + 注意：发回去的`formData`，事实上有3个，一个是用于索引的id，剩下两个是修改的值。
   + 这里就用到了`表单隐藏域`的概念，因为服务器需要一个索引去查找数据，所以表单里得有个索引一同发送过去

   在模板字符串中有：

   ```html
    <!-- 表单隐藏域 -->
         <input type="hidden" name="cate_id" value="{% $value.cate_id %}">
   ```

   这个做法可以把`cate_id`传过去，同时，用户也看不到这个输入框

   

6. 服务器收到请求，并处理

   ```javascript
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
   ```

   

7. 客户端收到服务器响应，完善回调

   ```javascript
     //编辑分类之提交模态框的表单
     $('#editId').on('click',handleSubmit)
   
     function handleSubmit(){
       var formData = $('#edit-form').serialize()
       $.ajax({
         url:'/api/categories/update',
         method:'POST',
         data:formData,
         dataType:'json',
         success:function(result){
           if(result.success)
             //先关闭模态框，再重新渲染列表
             $('#editCateModalId').modal('hide')
             loadList()
         },
         error:function(err){
           console.log('出错啦')
         }
       })
     }
   ```

   

### 关于`Ajax`中的`url`

注意到上面所有Ajax里面的url，开头都是`/`

**绝对路径**url开头为一个斜杠"/"，这个斜杠说明这个请求从根目录去访问,这个是绝对路径。

**相对路径**相对路径就是相对于html页面路径的路径，记住，不是相对于请求的JS文件的路径。

倘若你当前的网页是`127.0.0.1:3000/admin/categories` 

若url不加`/`,即`url:'api/categories/delete'`

他就会去请求`127.0.0.1:3000/admin/categories/api/categories/delete`

而不是`127.0.0.1:3000/api/categories/delete`（你希望他去请求的地址）



### Ajax中的全局错误处理

再模板页`layout.html`加入。进行客户端全局错误处理

```javascript
 // 客户端全局错误处理
    $( document ).ajaxError(function(event,jqXHR,settings) {
      if (jqXHR.status >= 500){
        alert('服务器内部错误，请稍候重试')
      }
    })
```





## 用户管理页面

### 用户列表

其实主要的思想和前面分类列表的思想一模一样。因而这里直接给出代码

1. 客户端发送ajax 请求接口 `/api/users`

   users.html

   ```javascript
    function loadList() {
       $.ajax({
         url: '/api/users',
         method: 'GET',
         success: function(result) {
          // 渲染页面
         }
       })
     }
   ```

   

2. 服务端收到请求，操作数据库，返回数据

   ```javascript
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
   ```

   

3. 客户端收到响应，完善回调

   ```javascript
   function loadList() {
       $.ajax({
         url: '/api/users',
         method: 'GET',
         success: function(result) {
          // 渲染页面
             var htmlStr = template('usersTemplateId',{
                  userList: result.ret
             })
             $('#list_container').html(htmlStr)
         }
       })
     }
   ```



### 添加用户



使用了一个插件来帮我们验证表单

jQuery Validation Plugin 表单验证

- [官网](https://jqueryvalidation.org/)
- [Github 仓库](https://github.com/jquery-validation/jquery-validation)
- [菜鸟教程](http://www.runoob.com/jquery/jquery-plugin-validate.html)

安装

```bash
npm i jquery-validation
```

加载

```html
<script src="jquery.js"></script>
<script src="jquery.validate.js"></script>
<!-- jquery-validation 默认的提示消息是英文，引入该文件让其显式中文 -->
<script src="messages_zh.js"></script>
```

使用（包括异步验证）

```javascript
  // 该方法会自动监听表单的提交行为
  // 当你提交表单的时候，它就根据你在表单控件中设置的验证规则，进行验证
  // 如果验证失败，就在界面上给出提示
  // 如果验证通过，则调用 submitHandler 方法，所以我们可以把请求服务端提交数据的代码写到 submitHandler 中
  // 设置验证规则
  $("#add_form").validate({
    // 自定义规则
    rules:{
      admin_email:{
        required: true,
        // 异步验证
        // 你输入完他就检测是否存在
        remote:{
          url: "/api/users/checkemail",     //后台处理程序
          type: "GET",              		 //数据发送方式
          // 这里不用写data，自动会把值发过去，服务端就用req.query接收
          dataType: "json"
        }
      },
      admin_pwd:{
        required:true,
        minlength:2,
        maxlength:10
      }
    },
    // 自定义错误提示消息
    messages:{
      admin_email:{
        required:"邮箱不能为空",
        remote:'邮箱已经存在'
      },
      admin_pwd:{
        required:'密码不能为空',
        minlength:'密码长度为2至10位',
        maxlength:'密码长度为2至10位'
      }
    }
  })
```

由于要异步验证邮箱是否存在，因而要注册该路由

```javascript
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
```

> 注意：当数据库中WHERE查不到数据的时候，返回的`ret`是一个空数组，可以通过判断`ret`数组的长度来判断是否有这个数据！！

做完这些后，当你输入的有问题时，就会出现红字提醒

自定义错误提示文本样式

```css
form label.error {
	color: red !important;
}
```



接下来的思路就同添加分类一样

1. 客户端监听submit事件，解析表单数据，发送Ajax请求`/api/user/create`接口

   ```javascript
    // 添加用户
     $('#add_form').on('submit',handleAdd)
   
     function handleAdd(){
       var formData = $('#add_form').serialize()
       $.ajax({
         url:'/api/user/create',
         method:'POST',
         data:formData,
         dataType:'json',
         success:function(result){
           //重新渲染页面
         }
       })
     }
   ```

2. 服务端响应，操作数据库，响应请求

   ```javascript
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
   ```

3. 客户端收到响应，完善回调

   ```javascript
   // 添加用户
     $('#add_form').on('submit',handleAdd)
   
     function handleAdd(){
       var formData = $('#add_form').serialize()
       $.ajax({
         url:'/api/user/create',
         method:'POST',
         data:formData,
         dataType:'json',
         success:function(result){
           //重新渲染页面
             loadList()
         }
       })
     }
   ```

   

### 删除用户

与删除分类相同，不再赘述

1. 点击删除时，发送Ajax请求，把对应的id也发送过去，接口为`/api/user/delete`

   ```javascript
     // 删除用户
     $('#list_container').on('click','a[name=delete]',handleDelete)
   
     function handleDelete(){
       if(!window.confirm('确定删除吗？'))
         return
       id = $(this).data('id')
       $.ajax({
         url:'/api/user/delete',
         method:'GET',
         data:{
           id:id
         },
         dataType:'json',
         success:function(result){
           // 重新渲染页面
           loadList()
         }
       })
     }
   ```

2. 服务器接到请求，解析id，操作数据库，响应

   ```javascript
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
   ```

3. 完善回调

   ```javascript
    // 删除用户
     $('#list_container').on('click','a[name=delete]',handleDelete)
   
     function handleDelete(){
       if(!window.confirm('确定删除吗？'))
         return
       id = $(this).data('id')
       $.ajax({
         url:'/api/user/delete',
         method:'GET',
         data:{
           id:id
         },
         dataType:'json',
         success:function(result){
           // 重新渲染页面
           loadList()
         }
       })
     }
   ```

### 编辑用户

与编辑分类一样，不再赘述