module.exports = (req, res, next) => { // 所有以 /admin/ 开头的请求都会进入这个中间件
    // 1. 如果是 /admin/login 则直接允许通过
    if (req.originalUrl === '/admin/login') {
      return next()
    }
  
    // 2. 非 /admin/login 的页面都校验登录状态
    const sessionUser = req.session.user
    // 2.1 如果没有则让其去登录
    if (!sessionUser) {
      return res.redirect('/admin/login')
    }
    
    // 2.2 如果登录了则让其通过
    next()
  }