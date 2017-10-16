// Dependencias
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var moment = require('moment'); // Fechas

var app = express();
var port = 8080;
var secret = '123456'; // Secret key para JWT

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "database.db"
    },
    useNullAsDefault: true
});


// Base de datos
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

// Inicializado de Base de datos
function initDatabase() {
    db.serialize(function() {
        // Usuarios
        var usuario_table = 'CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, password TEXT, token TEXT)';
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

    // Borrado de datos antes de insertado
    db.run(`DELETE FROM usuario WHERE id > 0`);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'usuario'`);
    db.run(`DELETE FROM casa WHERE id > 0`);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'casa'`);
    db.run(`DELETE FROM controlador WHERE id > 0`);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'controlador'`);

    // Insertado de datos
    db.run(`INSERT INTO usuario(login, password, token) VALUES(?, ?, ?)`, ['morenocantoj', 'elfaryvive', null], function(err) {
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

// Metodo de login
function login(login, password, callback) {

    var payload = {
        login: login,
        exp: moment().add(7, 'days').valueOf()
    }
    var token = jwt.encode(payload, secret);

    knex('usuario').where('login', login).where('password', password).update({token: token})
        .then(function (rows) {
            if (rows) {
                console.log(rows);
                callback(token);
            } else {
                console.log("Login no correcto");
                callback(false)
            }
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            callback(false);
        });
}

// Middleware que supervisa la autenticacion
function checkAuth(pet, resp, next) {
    if (pet.session.usuarioActual)
        next();
    else {
        resp.status(401);
        resp.send({message: "Debes autentificarte para poder manejar la URL"});      
    }
}

/**
 * Consigue el ID del usuario actual
 * @param {*} token token pasado por parametro
 * @param {*} callback function callback
 */
function getCurrentUserId(token, callback) {
    knex('usuario').where('token', token).column('id')
        .then(function (row) {
            currToken = row[0];
            callback(currToken);
        })
        .catch(function (err) {
            console.log("Error: " + err);
            return false;
        });
}

/**
 * Devuelve todos los datos de una casa
 * @param {*} id de la casa
 * @param {*} callback function callback
 */
function getHouse(id, callback) {
    knex('casa').where('id', id).column('id', 'nombre')
        .then(function(row) {
            // Solo es posible tener una entrada
            callback(row[0]);
        })
        .catch(function (err) {
            console.log("Error: " + err);
            return false;
        })
}

/**
 * Devuelve todos los controladores de una casa
 * @param {*} house_id 
 * @param {*} callback 
 */
function getControllers(house_id, callback) {
    knex('controlador').where('casa_id', house_id).column('id', 'nombre')
        .then(function (rows) {
            callback(rows);
        })
        .catch(function (err) {
            console.log("Error: " + err);
            return false;
        })
}

/**
 * Devuelve todos los dispositivos asociados a un controlador
 * @param {*} controller_id 
 * @param {*} callback 
 */
function getDevices(controller_id, callback) {
    knex('dispositivo').where('controller_id', controller_id).column('id', 'nombre', 'temperatura')
        .then(function (rows) {
            callback(rows);
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            return false;
        })
}

// Enrutador
var router = express.Router();

/* -- RUTAS -- */

// Main
app.get('/', function(pet, resp){
   resp.status(200);
   resp.send({message: "Bienvenido a la API de domótica IberRally", loginUrl: "http://localhost:8080/api/login"});
});

// Prefijo para todas las llamadas a la API
app.use('/api', router);

// Controlador completo de una habitacion
router.get('/casas/:id/controller/:controller_id', function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;
    // TODO: Acabar
});

// Casas de un usuario
router.get('/casas', function(req, resp) {
    // Verificamos el usuario
    getCurrentUserId(req.query.token, function(res) {
        if (!res) {
            resp.status(500);
            resp.send({errMessage: "No estás autenticado!", url: "http://localhost:8080/api/login"});

        } else {
            var userId = res.id;
            knex('casa').select('id', 'nombre').where('user_id', userId)
                .then(function(rows) {
                    if (rows) {
                        var result = [];
                        resp.status(200);
                        rows.forEach(function(element) {
                            result.push({id: element.id, nombre: element.nombre});
                        }, this);

                        var json = {casas: result, urlCasa: "http://localhost:8080/api/casas/{:id}"};
                        resp.send(JSON.stringify(json));
                    } else {
                        resp.status(404);
                        resp.send({message: "No existen inmuebles para este usuario"});
                    }
                })
        }
    });
});

// Casa individual
router.get('/casas/:id', function(req, resp) {
    let houseId = req.params.id;
    console.log("GET /api/casas/"+houseId);

    // Comprueba si la ID es mayor que 0
    if (houseId > 0) {
        getHouse(houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el elemento "+houseId});

            } else {
                var result = [];

                // Buscar controladores de la casa
                getControllers(houseId, function(controllers) {

                    controllers.forEach(function(element) {
                        result.push({id: element.id, nombre: element.nombre});
                    }, this);

                    json_result = {inmueble_id: houseId, inmueble_nombre: house.nombre, controladores: result};
                    resp.status(200);
                    resp.send(JSON.stringify(json_result));
                });
            }
        })

    } else {
        console.log("Error: El id no es válido");
        resp.status(500);
        resp.send({errMessage: "El id ("+houseId+") no es válido"});
    }
});

// Autenticacion
router.post('/login', function(req, resp) {

    var loginName = req.body.login;
    var password = req.body.password;

    login(loginName, password, function(result) {
        var token = result;
        if (token == false) {
            console.log("False");
            resp.status(500);
            resp.send({errMessage: "Login incorrecto!"});

        } else {
            // Login correcto
            console.log(token);
            resp.status(200);
            resp.send({token: token});
        }
    });
})

/* -- /RUTAS -- */

// Puesta en marcha de BD
initDatabase();

// Arranque del servidor
app.listen(port);
console.log("Escuchando por el puerto " + port);