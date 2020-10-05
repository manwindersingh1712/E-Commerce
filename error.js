const sum=(a,b)=>{
    if(a && b ){
        return a+b;
    }

    throw new Error('Invalid arguments -by Manwinder');
}

try{
    console.log(sum(1,8))
} catch(error){
    console.log(error);
}


console.log('This works!')