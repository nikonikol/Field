var express=require('express')
var fs=require('fs')
const multer = require('multer');
var session=require('express-session')
var router=require('./router')
var bodyParser=require('body-parser')

var app=express()
//配置模板引擎
app.engine('html',require('express-art-template'))
//公开文件夹
app.use('/node_modules/',express.static('./node_modules'))
app.use('/public/',express.static('./public'))

//配置文件读取
let multerObj = multer({dest:'./upload'});
app.use(multerObj.any());
//配置body=parser
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(session({
    // 配置加密字符串，它会在原有加密基础之上和这个字符串拼起来去加密
    // 目的是为了增加安全性，防止客户端恶意伪造
    secret: 'itcast',
    resave: false,
    saveUninitialized: false // 无论你是否使用 Session ，我都默认直接给你分配一把钥匙
  }))
//把路由容器挂载到app服务中
app.use(router)
//设置404页面
app.use(function(req,res,next){
    res.render('404.html')
})
//监听窗口
app.listen(4000,function(){
    console.log('fighting`````')
})