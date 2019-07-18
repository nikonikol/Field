/**
 * router.js路由模块
 * 职责
 *  处理登陆功能路由
 *  根据不同请求响应url
 */
//Excle
const xlsx = require('node-xlsx')
//加载文件
var fs = require('fs')
//加载express，包装路由
var express = require('express')
//加载mysql.js
var infoquery = require('./models/mysql')
//加载md5插件
var md5 = require('blueimp-md5')
//加载运算函数
var calbulk = require('./public/js/cal.js')
//promise函数
function mypinfoquery(sql) {
    return new Promise(function (resolve, reject) {
        infoquery(sql, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data)
        })
    })
}

//创建一个路由容器
var router = express.Router()


/* 登陆路由*/
//渲染登陆页面
router.get('/', function (req, res) {
    res.render('login.html')
})

//登录请求
router.post('/', function (req, res) {
    //获取请求体
    var userid = req.body.UserId
    var password = req.body.Password
    var sql = null
    //匹配登陆账号和密码
    try {
        sql = `SELECT
        studentinfo.UserId,
        studentinfo.Password,
        studentinfo.NickName,
        studentinfo.Icon,
        studentinfo.Class,
        studentinfo.Role
    FROM
        studentinfo
    WHERE
        studentinfo.UserId="` + userid + `" AND
        studentinfo.Password="` + password + `"AND
        studentinfo.role=1
        `
        infoquery(sql, function (err, data) {
            console.log(data)
            if (err) {
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            // 如果账号和密码匹配，则 Userinformation 是查询到的用户对象，否则就是 null
            if (!data[0]) {
                return res.status(200).json({
                    //提供错误码
                    err_code: 1,
                    message: 'nickname or password is invalid.'
                })
            } else {
                req.session.Userinformation = data
                // 用户存在，登陆成功，通过 Session 记录登陆状态
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})

//退出请求
router.get('/out', function (req, res) {
    // 清除登陆状态
    req.session.Userinformation = null
    // 重定向到登录页
    res.redirect('/')
})


/** 个人信息请求*/
router.get('/selfinformation', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        console.log(userid)
        try {
            sql = `SELECT
            studentinfo.Class,
            studentinfo.NickName,
            studentinfo.Icon,
            studentinfo.Password
        FROM
            studentinfo
        WHERE
            studentinfo.UserId="` + userid + `"
        `
            infoquery(sql, function (err, selfinformation) {
                console.log(selfinformation)
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (selfinformation) {
                    res.render('selfinformation.html', {
                        Userinformation: req.session.Userinformation,
                        selfinformation: selfinformation
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }
})
router.post('/selfinformation', function (req, res) {
    var sql = null
    var userid = req.session.Userinformation[0].UserId
    var nickname = req.body.nickname
    var password = req.body.password
    try {
        sql = `UPDATE 
        studentinfo 
        SET
        studentinfo.NickName="` + nickname + `",studentinfo.Password="` + password + `"
        WHERE
        studentinfo.UserId="` + userid + `"
        
        `
        infoquery(sql, function (err) {
            if (err) {
                return res.status(200).json({
                    err_code: 1,
                    message: ''
                })
            } else {
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })

    } catch (err) {
        res.status(500).json({
            err_code: 500,
            message: err.message
        })
    }
})


/* index路由*/
router.get('/index', function (req, res) {

    //渲染页面
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    }

    var teacherclass = req.session.Userinformation[0].Class
    var teacherclass = teacherclass.split(',')
    var userid = req.session.Userinformation[0].UserId
    try {

        sql = `SELECT
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskState,
        tasktable.TaskContent
        FROM
        tasktable
        WHERE
        tasktable.Sponsor="` + userid + `"
    `
        infoquery(sql, function (err, data) {
            if (err) {
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            Taskinformation = data
            for (j = 0; j < data.length; j++) {
                Taskinformation[j].FromTime = Taskinformation[j].FromTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
                Taskinformation[j].EndTime = Taskinformation[j].EndTime.toLocaleString().replace(/[年月]/g, '-').replace(/[日上下午]/g, '');
            }
            var studentarry = new Array
            var istrue = 0
            for (i = 0; i < teacherclass.length; i++) {

                sqlclass = `
                SELECT
                studentinfo.Class,
                studentinfo.NickName,
                studentinfo.Name,
                studentinfo.UserId
                FROM
                studentinfo
                WHERE
                studentinfo.Class = '` + teacherclass[i] + `' 
               `
                infoquery(sqlclass, function (err, data) {
                    if (err) {
                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }
                    studentarry = studentarry.concat(data)
                    istrue = istrue + 1

                    if (teacherclass.length === istrue) {
                        res.render('index.html', {
                            Userinformation: req.session.Userinformation,
                            Taskinformation: Taskinformation,
                            Studentinformation: studentarry
                        })
                    }
                })

            }
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})


/* 任务路由 */
//展示任务
router.get('/task', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        try {
            sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
            infoquery(sql, function (err, task) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (task) {
                    for (var i = 0; i < task.length; i++) {
                        //把时间转换
                        task[i].FromTime = task[i].FromTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                        task[i].EndTime = task[i].EndTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                    }

                    res.render('task.html', {
                        Userinformation: req.session.Userinformation,
                        task: task
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }

    }
})

//发布新任务
router.get('/newtask', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        try {
            sql = `SELECT
        studentinfo.Class
    FROM
        studentinfo
    WHERE
        studentinfo.UserId="` + userid + `"
    `
            infoquery(sql, function (err, newtask) {
                newtask = newtask[0].Class.split(',')
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (newtask) {
                    res.render('newtask.html', {
                        Userinformation: req.session.Userinformation,
                        newtask: newtask
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }
})
router.post('/newtask', function (req, res) {
    var sql = null
    var sponsor = req.session.Userinformation[0].UserId
    var taskstate = 0
    var taskname = req.body.taskname
    var grade = req.body.class
    var fromtime = req.body.fromtime
    var endtime = req.body.endtime
    var address = req.body.address
    var taskcontent = req.body.taskcontent
    try {
        sql = `INSERT INTO
        tasktable 
        (TaskState,Sponsor,TaskContent,Address,Class,TaskName,EndTime,FromTime,TaskId)
        VALUES
        ("` + taskstate + `","` + sponsor + `","` + taskcontent + `","` + address + `","` + grade + `","` + taskname + `","` + endtime + `","` + fromtime + `",0)
        `
        infoquery(sql, function (err) {
            if (err) {
                return res.status(200).json({
                    err_code: 1,
                    message: ''
                })
            } else {
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })

    } catch (err) {
        res.status(500).json({
            err_code: 500,
            message: err.message
        })
    }
})

//删除任务
router.get('/deletetask', function (req, res) {
        if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
            return res.redirect('/')
        } else {
            var sql = null
            var taskid = req.query.Taskid
            try {
                sql = `
    DELETE
    FROM
    tasktable
    WHERE
    tasktable.TaskId="` + taskid + `"
    `
                infoquery(sql, function (err) {
                    if (err) {
                        return res.status(500).send('Server error')
                    }
                    res.redirect('/task')
                })
            } catch (err) {
                res.status(500).json({
                    code: 2,
                    err: err.message,
                    message: ''
                })
            }
        }
    })


    /**
     * 任务测试路由
     *  */
    /
    //测试主页面
    router.get('/test', function (req, res) {
        if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
            return res.redirect('/')
        } else {
            var taskid = req.query.Taskid
            var sql = null
            try {
                sql = `SELECT
        testtable.Testid,
        testtable.TestName,
        testtable.TaskId,
        testtable.Content,
        testtable.State,
        testtable.TotalGrade,
        testtable.Deadtime
        FROM
        testtable
        WHERE
        testtable.TaskId="` + taskid + `"
        `
                infoquery(sql, function (err, test) {
                    if (err) {
                        return res.status(500).send('Server error')
                    }
                    for (var i = 0; i < test.length; i++) {
                        //把时间转换
                        test[i].Deadtime = test[i].Deadtime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                    }
                    if (test) {
                        res.render('test.html', {
                            Userinformation: req.session.Userinformation,
                            taskid:taskid,
                            test: test
                        })
                    }
                })
            } catch (err) {
                res.status(500).json({
                    code: 2,
                    err: err.message,
                    message: ''
                })
            }
        }
    })

//发布新测试
router.get('/newtest', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var taskid = req.query.Taskid
        var sql = null
        try {
            sql = `SELECT
        testtable.Testid,
        testtable.TestName,
        testtable.TaskId,
        testtable.Content,
        testtable.TotalGrade,
        testtable.Deadtime
        FROM
        testtable
        WHERE
        testtable.TaskId="` + taskid + `"
        `
            infoquery(sql, function (err, newtest) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (newtest) {
                    res.render('newtest.html', {
                        taskid:taskid,
                        Userinformation: req.session.Userinformation,
                        newtest: newtest
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }
})

router.post('/newtest', function (req, res) {
    var sql = null
    var testname = req.body.testname
    var taskid = parseInt(req.headers.referer.split('=').slice(1, 2)[0])
    var totalgrade = req.body.totalgrade
    var deadtime = req.body.deadtime
    var testcontent = req.body.testcontent
    try {
        sql = `INSERT INTO
        testtable 
        (TestName,TaskId,Content,TotalGrade,Deadtime,Testid)
        VALUES
        ("` + testname + `","` + taskid + `","` + testcontent + `","` + totalgrade + `","` + deadtime + `",0)
        `
        infoquery(sql, function (err, data) {
            if (err) {

                return res.status(200).json({
                    err_code: 1,
                    message: ''
                })
            } else {
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })

    } catch (err) {
        res.status(500).json({
            err_code: 500,
            message: err.message
        })
    }
})


//修改测试
router.get('/edittest', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('edittest.html', {
            Userinformation: req.session.Userinformation
        })
    }
})

//删除测试
router.get('/deletetest', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var taskid = req.query.Taskid
        var testid = req.query.Testid
        try {
            sql = `
        DELETE
        FROM
        testtable
        WHERE
        testtable.TestId="` + testid + `"
        `
            infoquery(sql, function (err, data) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                res.redirect('/test?Taskid=' + taskid)
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }
})


//批改测试
router.get('/correcttest', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        try {
            sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
            infoquery(sql, function (err, task) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (task) {
                    res.render('correcttest.html', {
                        Userinformation: req.session.Userinformation,
                        task: task
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }

        // var taskid = req.query.TaskId
        // var userid = req.query.UserId
        // var sql = null
        // try {
        //     sql = `SELECT
        // testresult.UserId,
        // testresult.TaskId,
        // testresult.TestId,
        // testresult.Grade,
        // testresult.SubmitTime,
        // testresult.Answer,
        // testresult.Evaluate
        // FROM
        // testresult
        // WHERE
        // testresult.TaskId="` + taskid + `"AND
        // testresult.UserId="` + userid + `"
        // `
        //     mysql(sql, function (err, correcttest) {
        //         console.log(correcttest)
        //         if (err) {
        //             return res.status(500).send('Server error')
        //         }
        //         if (correcttest) {
        //             res.render('correcttest.html', {
        //                 Userinformation: req.session.Userinformation,
        //                 correcttest: correcttest
        //             })
        //         }
        //     })
        // } catch (err) {
        //     res.status(500).json({
        //         code: 2,
        //         err: err.message,
        //         message: ''
        //     })
        // }
    }
})

router.get('/correctexam', function (req, res) {
    var TaskId = req.query.Taskid
    var TestId = req.query.Testid
    searchsql = `SELECT
    a.Name,
    c.Answer,
    c.SubmitTime,
    c.UserId,
    b.TotalGrade,
    b.Testid,
    b.TaskId,
    b.Content
    FROM
    testresult AS c
    LEFT JOIN studentinfo AS a ON a.UserId = c.UserId
    LEFT JOIN testtable AS b ON b.Testid = c.TestId AND b.TaskId = c.TaskId
    WHERE
    c.TaskId = ` + TaskId + ` AND c.TestId = ` + TestId + ` AND c.State=0
`;
    (async () => {

        const result = await mypinfoquery(searchsql)

        console.log(result, '')

        res.render('examcorrect.html', {
            Userinformation: req.session.Userinformation,
            ExamList: result
        })
        // if (result[0] === undefined) {
        //     // 插入
        //     await mypinfoquery(insectsql)
        // }
        // else{
        //     // 更新
        //     await mypinfoquery(updatesql)
        // }

    })()







    // var sql = null
    // var grade = req.body.grade
    // var correctcontent = req.body.correctcontent
    // try {
    //     sql = `"UPDATE
    //     testresult
    //     SET 

    //     `
    //     infoquery(sql, function (err, data) {
    //         if (err) {

    //             return res.status(200).json({
    //                 err_code: 1,
    //                 message: ''
    //             })
    //         } else {
    //             res.status(200).json({
    //                 err_code: 0,
    //                 message: 'OK'
    //             })
    //         }
    //     })

    // } catch (err) {
    //     res.status(500).json({
    //         err_code: 500,
    //         message: err.message
    //     })
    // }
})
router.post('/correctexam', function (req, res) {
    var sql = null
    var gradearry = req.body.gradelist.split(',')
    var commentarry = req.body.commentlist.split(',')
    var TestID = req.body.TestID.split(',')
    var TaskID = req.body.TaskID.split(',')
    var UserID = req.body.UserID.split(',')
    console.log(TestID, 'ExamList')
    console.log(TaskID, 'ExamList')
    console.log(gradearry, 'gradearry')
    console.log(commentarry, 'commentarry')
    console.log(UserID, 'UserID')
   
        ;
        (async () => {
        try {
        for(i=0;i<gradearry.length;i++){
            await mypinfoquery("UPDATE testresult SET Grade=" + gradearry[i] + ",State=1,Evaluate='" + commentarry[i] + "' WHERE UserId='" + UserID[i] + "' AND TaskId=" + TaskID[i] + " AND TestId=" + TestID[i])
            await mypinfoquery("UPDATE testtable SET State=1 WHERE TaskId=" + TaskID[i] + " AND TestId=" + TestID[i])
            const queryresult = await mypinfoquery(`SELECT testresult.Grade FROM testresult WHERE testresult.TaskId=` + TaskID[i]  + ` AND testresult.UserId ='` + UserID[i] + `'`)
            SumGrade = 0
            for (j = 0; j < queryresult.length; j++) {
                SumGrade += queryresult[j].Grade
            }
            await mypinfoquery("UPDATE testresult SET FinallyGrade=" + SumGrade + "  WHERE UserId='" + UserID[i] + "' AND TaskId=" + TaskID[i])
        }
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            message: err.message
        })
    }

    return res.status(200).json({
        err_code: 0,
        message: ''
    })
    })()
   
      
  

   
})



/**
 * 学生
 */
//通过任务展示学生信息
router.get('/studenttask', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var grade = req.query.class
        var taskid = req.query.taskid
        try {
            sql = `SELECT
        studentinfo.UserId,
        studentinfo.Class,
        studentinfo.Name,
        location.LastTime,
        location.Location,
        tasktable.TaskId,
        testresult.FinallyGrade
        FROM
        studentinfo,
        location,
        tasktable,
        testresult
        WHERE
        tasktable.TaskId="` + taskid + `"AND
        tasktable.Class=studentinfo.Class AND
        studentinfo.UserId=location.UserId AND
        studentinfo.UserId = testresult.UserId
        ORDER BY
        studentinfo.UserId
        `
            infoquery(sql, function (err, studata) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (studata) {
                    res.render('studata.html', {
                        Userinformation: req.session.Userinformation,
                        studata: studata
                    })
                }
            })

        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }
})

//老师所带班级全部信息
router.get('/allstudent', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else
        var teacherclass = req.session.Userinformation[0].Class.split(',')
    var studentarry = new Array
    var istrue = 0
    try {
        for (i = 0; i < teacherclass.length; i++) {
            sqlclass = `
                SELECT
                studentinfo.Class,
                studentinfo.NickName,
                studentinfo.Name,
                studentinfo.UserId
                FROM
                studentinfo
                WHERE
                studentinfo.Class = '` + teacherclass[i] + `' 
               `
            infoquery(sqlclass, function (err, data) {
                if (err) {
                    return res.status(500).json({
                        err_code: 500,
                        message: err.message
                    })
                }
                studentarry = studentarry.concat(data)
                istrue = istrue + 1
                if (teacherclass.length === istrue) {
                    res.render('allstudent.html', {
                        Userinformation: req.session.Userinformation,
                        Studentinformation: studentarry
                    })
                }
            })
        }
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }


})

/**
 * 地图操作
 */

//统计
router.get('/stastic', function (req, res) {
    console.log('tag', '')
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        try {
            sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
            infoquery(sql, function (err, map) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (map) {
                    for (var i = 0; i < map.length; i++) {
                        //把时间转换
                        map[i].FromTime = map[i].FromTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                        map[i].EndTime = map[i].EndTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                    }
                    res.render('stastic.html', {
                        Userinformation: req.session.Userinformation,
                        map: map
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }

    }
})
//显示地图，先进入选择任务界面
router.get('/map', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        var sql = null
        var userid = req.session.Userinformation[0].UserId
        try {
            sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
            infoquery(sql, function (err, map) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (map) {
                    for (var i = 0; i < map.length; i++) {
                        //把时间转换
                        map[i].FromTime = map[i].FromTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                        map[i].EndTime = map[i].EndTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                    }
                    res.render('map.html', {
                        Userinformation: req.session.Userinformation,
                        map: map
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }

    }
})

//显示全部人员位置信息
router.get('/taskmap', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('allstumap.html', {
            Userinformation: req.session.Userinformation
        })
    }



    router.post('/taskmap', function (req, res) {
        var taskid = parseInt(req.headers.referer.split('=').slice(1, 2)[0])
        try {
            sql = `SELECT
        studentinfo.Name,
        studentinfo.Class,
        location.UserId,
        location.Location,
        location.TaskId
        FROM
        studentinfo ,
        location
        WHERE
        location.TaskId = "` + taskid + `" AND
        studentinfo.UserId = location.UserId
        `
            infoquery(sql, function (err, taskmap) {
                //获取最后一个值 
                // console.log(JSON.parse(taskmap[0].Location).location.slice(-1)[0].log)
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (taskmap) {
                    return res.status(200).json({
                        taskmap: taskmap
                    })

                }
            })

        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    })
})

//显示人员轨迹信息
router.get('/onemap', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('onestumap.html', {
            Userinformation: req.session.Userinformation
        })
    }
})

router.post('/onemap', function (req, res) {
    var userid = req.headers.referer.split('=').slice(1, 2)[0]
    console.log(userid)
    try {
        sql = `SELECT
        studentinfo.Name,
        studentinfo.Class,
        location.UserId,
        location.Location,
        location.TaskId
        FROM
        studentinfo ,
        location
        WHERE
        location.UserId = "` + userid + `" AND
        studentinfo.UserId = location.UserId
        `
        infoquery(sql, function (err, onemap) {
            if (err) {
                return res.status(500).send('Server error')
            }
            if (onemap) {
                return res.status(200).json({
                    onemap: onemap
                })

            }
        })

    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})



//导入数据学生数据到数据库Importexcel
/*获取所有学生位置信息路由*/
router.get('/SaveExcle', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('saveexcle.html', {
            Userinformation: req.session.Userinformation
        })
    }
})
router.post('/SaveExcle', function (req, res) {
    //  配置文件操作
    var excelConfig = {
        excel_Dir: req.files[0].path,
        CityArray: ['Class', 'Name', 'UserId']
    }
    //  获取文件
    let obj = xlsx.parse(excelConfig.excel_Dir); // 支持的excel文件类有.xlsx .xls .xlsm .xltx .xltm .xlsb .xlam等
    //console.log(obj)
    let excelObj = obj[0].data; //取得第一个excel表的数据
    let insertData = []; //存放数据

    //循环遍历表每一行的数据
    for (var i = 1; i < excelObj.length; i++) {
        var rdata = excelObj[i];
        // console.log(rdata)

        var CityObj = new Object();
        // ["id" : "101010100","provinceZh" : "北京","leaderZh" : "北京","cityZh" : "北京","cityEn" : "beijing"]
        for (var j = 0; j < rdata.length; j++) {
            CityObj[excelConfig.CityArray[j]] = rdata[j]
        }
        insertData.push(CityObj)
        //console.log(CityObj)
    }
    //获取到要插入数据库的对象
    console.log(insertData)

    try {
        //插入数据库
        for (i = 0; i < insertData.length; i++) {
            UserId = insertData[i].UserId
            Name = insertData[i].Name
            Password = insertData[i].UserId
            Nickname = insertData[i].Name
            Class = insertData[i].Class
            AddData(UserId, Name, Password, Nickname, Class)
        }

        res.render('saveexcle.html', {
            Userinformation: req.session.Userinformation,
            Success: '文件上传成功'
        })

    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            code: 2,
            err: err.message,
            message: []
        })

        res.render('saveexcle.html', {
            Userinformation: req.session.Userinformation,
            Success: '文件上传失败'
        })
    }


    function AddData(UserId, Name, Password, Nickname, Class) {
        console.log(UserId, Name, Password, Nickname, Class)
        searchsql = `SELECT
        studentinfo.Name
        FROM
        studentinfo
        WHERE
        studentinfo.UserId = '` + UserId + `'`

        var updatesql = "UPDATE studentinfo SET UserId='" + UserId + "',Name='" + Name + "',Password='" + Password + "',  Nickname='" + Nickname + "',  Class='" + Class + "' WHERE UserId='" + UserId + "'"
        var insectsql = "INSERT INTO studentinfo (UserId,Name,Password,Nickname,Icon,Class,Role) VALUES('" + UserId + "','" + Name + "','" + Password + "','" + Nickname + "','http://k.zol-img.com.cn/sjbbs/7692/a7691515_s.jpg','" + Class + "',0)"

        ;
        (async () => {

            const result = await mypinfoquery(searchsql)
            if (result[0] === undefined) {
                // 插入
                await mypinfoquery(insectsql)
            } else {
                // 更新
                await mypinfoquery(updatesql)
            }

        })()

    }
})

/**成绩统计路由 */
//统计数据
router.get('/gradedisplay', function (req, res) {
    var taskid = req.query.TaskId
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('gradedisplay.html', {
            Userinformation: req.session.Userinformation,
            taskid: taskid
        })
    }
})

router.post('/gradedisplay', function (req, res) {
    var taskid = req.query.TaskId
    var studentgrade = new Array
    var sum = function (x, y) {
        return x + y;
    }; //求和函数
    var square = function (x) {
        return x * x;
    }; //数组中每个元素求它的平方
    var querysult = new Array;
    (async () => {
        try {
            sql = `
                    SELECT
                    studentinfo.Class,
                    studentinfo.NickName,
                    studentinfo.Name,
                    studentinfo.UserId,
                    testresult.Grade
                    FROM
                    studentinfo,
                    testresult
                    WHERE
                    testresult.TaskId = '` + taskid + `' AND
                    testresult.UserId=studentinfo.UserId
                    ORDER BY
                    testresult.Grade ASC

                `
            studentgrade = await mypinfoquery(sql)
            var studentgradelist = new Array
            var studentgradename = new Array
            // if (studentgrade) {
            //     var grade = new Array
            //     var name = new Array
            //     var mycaldata = new Array    
            //     for (var i = 0; i < analydata.length; i++) {
            //         grade[i] = studentgrade[i].Grade
            //         name[i] = studentgrade[i].Name
            //         mycaldata[i] = studentgrade[i].Grade
            //     }
            //     return res.status(200).json({
            //         grade: grade,
            //         name: name,
            //         calreason:calbulk.cal(mycaldata)
            //     })
            // }
            for (k = 0; k < studentgrade.length; k++) {
                if (studentgrade != undefined) {
                    studentgradelist[k] = studentgrade[k].Grade
                    studentgradename[k] = studentgrade[k].Name
                }
            }
            querysult = studentgradelist
            queryname = studentgradename
            if (querysult[0] != undefined) {
                var name = new Array
                var mycaldata = new Array
                for (var i = 0; i < querysult.length; i++) {
                    mycaldata[i] = querysult[i]
                }
                for (var i = 0; i < queryname.length; i++) {
                    name[i] = queryname[i]
                }
                return res.status(200).json({
                    calreason: calbulk.cal(mycaldata),
                    name: name,
                    grade: mycaldata
                })
            }
            //studentgrade[i]=querysult[i].FinallyGrade
            //console.log(querysult[0].FinallyGrade, querysult[querysult.length-1].FinallyGrade)
            //studentgrade

            // for (j = 0; j < querysult.length; j++) {
            //     if (querysult[j] != undefined) {
            //         console.log(querysult.length)
            //         var mean = querysult[j].reduce(sum) / querysult[j].length
            //         console.log(mean)
            //         var deviations = querysult[j].map(function (x) {
            //             return x - mean;
            //         })
            //         var stddev = Math.sqrt(deviations.map(square).reduce(sum) / (querysult[j].length - 1));
            //         var max = Math.max.apply(null, querysult[j])
            //         var min = Math.min.apply(null, querysult[j])
            //         if (querysult[j].length % 2 == 0) {
            //             mid = (querysult[j][querysult[j].length / 2] + querysult[j][querysult[j].length / 2 + 1]) / 2
            //         }
            //         if (querysult[j].length % 2 != 0) {
            //             mid = querysult[j][(querysult[j].length + 1) / 2]
            //         }
            //         console.log(mean + "平均数 ")
            //         console.log(deviations + "deviations ")
            //         console.log(stddev + "方差 ")
            //         console.log(max + "最大值 ")
            //         console.log(min + "最小值 ")
            //         console.log(mid + "中位数 ")
            //         // return res.status(200).json({
            //         //     code: 0,
            //         //     err: '成功',
            //         //     mean: mean,
            //         //     deviations: deviations,
            //         //     stddev: stddev,
            //         //     max: max,
            //         //     min: min,
            //         //     mid: mid
            //         // })
            //     }
            // }


        } catch (e) {
            res.status(500).json({
                code: 2,
                err: e.message,
                message: ''
            })
        }

    })()

})

// router.post('/gradedisplay', function (req, res) {
//     const teacherclass = req.session.Userinformation[0].Class.split(',')
//     var studentgrade = new Array
//     var sum = function (x, y) {
//         return x + y;
//     }; //求和函数
//     var square = function (x) {
//         return x * x;
//     }; //数组中每个元素求它的平方
//     var querysult = new Array;
//     (async () => {
//         try {
//             for (i = 0; i < teacherclass.length; i++) {
//                 sql = `
//                     SELECT
//                     studentinfo.Class,
//                     studentinfo.NickName,
//                     studentinfo.Name,
//                     studentinfo.UserId,
//                     testresult.Grade
//                     FROM
//                     studentinfo,
//                     testresult
//                     WHERE
//                     studentinfo.Class = '` + teacherclass[i] + `' 
//                     ORDER BY
//                     testresult.Grade ASC
//                 `
//                 studentgrade[i] = await mypinfoquery(sql)

//                 var studentgradelist = new Array
//                 for (k = 0; k < studentgrade[i].length; k++) {
//                     if (studentgrade[i][0] != undefined) {
//                         studentgradelist[k] = studentgrade[i][k].FinallyGrade
//                     }
//                 }
//                 querysult[i] = studentgradelist
//                 console.log(studentgradelist)
//                 //console.log( querysult[i])
//                 // if(querysult[0]==undefined){
//                 //     return
//                 // }
//                 //studentgrade[i]=querysult[i].FinallyGrade
//                 //console.log(querysult[0].FinallyGrade, querysult[querysult.length-1].FinallyGrade)
//                 //studentgrade
//             }
//             for (j = 0; j < querysult.length; j++) {
//                 if (querysult[j][0] != undefined) {
//                     var mean = querysult[j].reduce(sum) / querysult[j].length
//                     var deviations = querysult[j].map(function (x) {
//                         return x - mean;
//                     })
//                     var stddev = Math.sqrt(deviations.map(square).reduce(sum) / (querysult[j].length - 1));
//                     var max = Math.max.apply(null, querysult[j])
//                     var min = Math.min.apply(null, querysult[j])

//                     if (querysult[j].length % 2 == 0) {
//                         mid = (querysult[j][querysult[j].length / 2] + querysult[j][querysult[j].length / 2 + 1]) / 2
//                     }
//                     if (querysult[j].length % 2 != 0) {
//                         mid = querysult[j][(querysult[j].length + 1) / 2]
//                     }
//                     console.log(mean + "平均数 ")
//                     console.log(deviations + "deviations ")
//                     console.log(stddev + "方差 ")
//                     console.log(max + "最大值 ")
//                     console.log(min + "最小值 ")
//                     console.log(mid + "中位数 ")
//                 }
//             }
//             return res.status(200).json({
//                 code: 0,
//                 err: err.message,
//                 mean:mean,
//                 deviations:deviations,
//                 stddev:stddev,
//                 max:max,
//                 min:min,
//                 mid:mid

//             })
//         } catch (e) {

//             res.status(500).json({
//                 code: 2,
//                 err: e.message,
//                 message: ''
//             })
//         }

//     })()

// })

/**关于我们路由 */
router.get('/aboutour', function (req, res) {
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    } else {
        res.render('aboutour.html', {
            Userinformation: req.session.Userinformation
        })
    }
})


module.exports = router