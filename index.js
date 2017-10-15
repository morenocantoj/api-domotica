// Dependencias
var express = require('express');
var bp = require('body-parser');

var app = express();
var port = 8080;
app.use(bp.json());

// Base de datos
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

// Inicializado de Base de datos
function initDatabase() {
    db.serialize(function() {
        // Usuarios
        var usuario_table = 'CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, password TEXT)';
        db.run(usuario_table);
        // Casas
        var casa_table = 'CREATE TABLE IF NOT EXISTS casa (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES user(id))';
        db.run(casa_table);
        // Controladores
        var controlador_table = 'CREATE TABLE IF NOT EXISTS controlador (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, casa_id INTEGER, FOREIGN KEY(casa_id) REFERENCES casa(id))';
        db.run(controlador_table);
        // Dispositivos
        var dispositivo_table = 'CREATE TABLE IF NOT EXISTS dispositivo (id INTEGER PRIMARY KEY AUTOINCREMENT, temperatura INT, nombre TEXT, controller_id INTEGER, FOREIGN KEY(controller_id) REFERENCES controlador(id))';
        db.run(dispositivo_table);
        // Programaciones
        var programacion_table = 'CREATE TABLE IF NOT EXISTS programacion (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha DATETIME, action TEXT, controller_id INTEGER, dispositivo_id INTEGER, FOREIGN KEY(controller_id) REFERENCES controlador(id), FOREIGN KEY(dispositivo_id) REFERENCES dispositivo(id))';
        db.run(programacion_table);
    });

    // Insertado de datos
    db.run(`INSERT INTO usuario(login, password) VALUES(?, ?)`, ['morenocantoj', 'elfaryvive'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
    // ID: 1
    db.run(`INSERT INTO casa(nombre, user_id) VALUES(?, ?)`, ['Adosado en Marbella', '1'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
    // ID: 2
    db.run(`INSERT INTO casa(nombre, user_id) VALUES(?, ?)`, ['Piso en San Vicente', '1'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
    // Casa: 1, ID: 1
    db.run(`INSERT INTO controlador(nombre, casa_id) VALUES(?, ?)`, ['Vestíbulo', '1'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
    // Casa: 1, ID: 2
    db.run(`INSERT INTO controlador(nombre, casa_id) VALUES(?, ?)`, ['Habitación de matrimonio', '1'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
    // Casa: 1, ID: 3
    db.run(`INSERT INTO controlador(nombre, casa_id) VALUES(?, ?)`, ['Habitación 2', '1'], function(err) {
        if (err) {
            console.log('Error: ' + err.message);
        }
    });
}

var router = express.Router(); // Enrutador

// Main
app.get('/', function(pet, resp){
   resp.status(200);
   resp.send({message: "Bienvenido a la API de domótica IberRally"});
});

// Prefijo para todas las llamadas a la API
app.use('/api', router);

// Puesta en marcha de BD
initDatabase();

// Arranque del servidor
app.listen(port);
console.log("Escuchando por el puerto " + port);