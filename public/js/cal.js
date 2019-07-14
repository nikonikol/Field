

function cal(data1){
    var data = data1;
    var reason ={
        mean:null,
        staddev:null,
        max:null,
        min:null,
        mid:null
    }
    var sum = function(x,y){ return x+y;};　　//求和函数
    var square = function(x){ return x*x;};　　//数组中每个元素求它的平方
    
    reason.mean = data.reduce(sum)/data.length;
    var deviations = data.map(function(x){return x-reason.mean;});
    reason.staddev = Math.sqrt(deviations.map(square).reduce(sum)/(data.length-1));
    
    reason.max = Math.max.apply(null,data)
    reason.min = Math.min.apply(null,data)
    var compare = function (x, y) {//比较函数
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    };
    data.sort(compare); //数组排序
    if (data.length%2==0){
        reason.mid = (data[data.length/2]+data[data.length/2+1])/2
    }
    if (data.length%2!=0){
        reason.mid = data[(data.length+1)/2]
    }
return reason;
}

exports.cal=cal