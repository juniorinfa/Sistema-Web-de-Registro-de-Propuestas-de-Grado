const mysql = require('mysql');
const { promisify } = require('util');


const { database } = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if(err){
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Se ha cerrado la conexión a la Base de Datos');
        }
        else if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('La base de datos tiene Demasiadas Conexiones');
        }
        else if (err.code === 'ECONNREFUSED') {
            console.error('Se ha rechazado la conexión a la Base de Datos')
        }
    }else{
        console.log('La Base de Datos fué Conectada');
    }
    return;
});

//Promisify Pool Querys
pool.query = promisify(pool.query);

module.exports = pool;

