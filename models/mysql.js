var express = require('express')
var mysql = require('mysql');
//创建链接
var myconnection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'fieldpractice'
});
 //连接
 myconnection.connect()

 function myquery(sql, calback) {
   myconnection.query(sql, function (err, res) {
     calback(err, res)
   })



 //关闭连接
 //myconnection.end();
   
 }
 
// connection.query('INSERT INTO users VALUES(NULL,"admin","123")', function (error, results, fields) {
//     if (error) throw error;
//     console.log('The solution is: ', results);
//   });

module.exports = myquery