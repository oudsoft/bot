interF = {
    value : "",
    read : function(){return value},
    write : function(value){this.value = value}
}

//var interf = new interF();

var arr = [11, 14, 19, 21, 22, 23, 27, 29, 31];

arr.forEach((item) => {
    interF.write(item);
    console.log(interF.read());
})