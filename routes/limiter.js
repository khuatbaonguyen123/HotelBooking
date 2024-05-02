const cli = require('../connect_redis');

const set = (key) => {
    return new Promise((resolve, reject) => {
        cli.set(key, 0, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        }) 
    })
}

const incr = (key) => {
    return new Promise((resolve, reject) => {
        cli.incr(key, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        }) 
    })
}

const expire = (key, ttl) => {
    return new Promise( (resolve, reject) => {
        cli.expire(key, ttl, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        })
    })
}

const ttl = (key) => {
    return new Promise( (resolve, reject) => {
        cli.ttl(key, (err, ttl) => {
            if(err) return reject(err);
            resolve(ttl);
        })
    })
}
module.exports = {set, incr, expire, ttl};