// Dependencias
var express = require('express');
var bodyparser = require('body-parser');
var jwt = require('jwt-simple');
var moment = require('moment'); // Fechas
var url = require('url');
var cors = require('cors');

var app = express();
app.use(cors());
var port = 3000;
var secret = '123456'; // Secret key para JWT

app.use( bodyparser.json() );       // to support JSON-encoded bodies
app.use(bodyparser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'domoti-k',
        password: 'domoti-k',
        database: 'domoti-k'
    }
});

// Metodo de login
function login(login, password, callback) {

    knex('usuarios').where({login: login, password: password}).select('login', 'password')
        .then(function (row) {
            console.log(row);
            if (row[0].login === login && row[0].password === password) {
                console.log("Login usuario correcto: " + login);

                var payload = {
                    login: login,
                    exp: moment().add(7, 'days').valueOf()
                }
                var token = jwt.encode(payload, secret);
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

// User para las SELECT
var username;

// Middleware que supervisa la autenticacion
function checkAuth(req, resp, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        token = bearerToken;

        try {
            let decoded = jwt.decode(token, secret);
            username = decoded.login;
            console.log(username);
            next();

        } catch (error) {
            resp.status(500);
            resp.send({errMessage: "Token no valido o sesion expirada",
                url: "http://localhost:8080/api/login"});
        }
    } else {
        res.status(403);
        res.send({errMessage: "Necesitas un token para poder realizar esta peticion"});
    }
}

/**
 * Consigue el ID del usuario actual comprobando el token
 * @param {*} token token pasado por parametro
 * @param {*} callback function callback
 */
function getCurrentUserId(user, callback) {
    knex('usuarios').where('login', user).column('id')
        .then(function (row) {
            user = row[0];
            callback(user);
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
    knex('casas').where('id', id).column('id', 'nombre', 'direccion', 'codigo_postal', 'poblacion')
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
    knex('controladores').where('casa_id', house_id).column('id', 'nombre')
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
function getDevices(controller_id, offset, callback) {
  var limit = 5;
  var query = knex('dispositivos').where('controller_id', controller_id).column('id', 'nombre', 'temperatura')

  // If client wants to paginate
  if (!isNaN(offset)) {
    query = query.limit(limit).offset(offset*5)
  }

  query.then(function (rows) {
      callback(rows);
  })
  .catch(function (err) {
      console.log("Error: " + err.message);
      return false;
  })
}

/**
 * Devuelve un controlador asociado a una casa con todos sus dispositivos
 * @param {*} controller_id
 * @param {*} callback
 */
function getController(controller_id, callback) {
    knex('controladores').where('id', controller_id).column('id', 'nombre', 'casa_id')
        .then(function (rows) {
            callback(rows[0]);
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            return false;
        });
}

/**
 * Inserta un dispositivo en un controlador de una casa
 * @param {*} controller
 * @param {*} name
 * @param {*} callback
 */
function insertDevice(controller, name, callback) {
    knex('dispositivos').returning('id').insert({temperatura: 21, nombre: name, controller_id: controller})
        .then(function (rows) {
            callback(rows[0]);
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            return false;
        });
}

/**
 * Actualiza la temperatura de un regulador
 * @param {*} device_id
 * @param {*} newValue
 * @param {*} callback
 */
function updateDevice(device_id, newValue, callback) {
    knex('dispositivos').where('id', device_id).update('temperatura', newValue)
    .then(function (rows) {
        callback(rows);
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
        return false;
    });
}

/**
 * Borra un dispositivo
 * @param {*} device_id
 * @param {*} callback
 */
function deleteDevice(device_id, callback) {
    knex('dispositivos').where('id', device_id).del()
        .then(function (row) {
            callback(row);
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            return false;
        })
}

/**
 * Inserts a programation into a device
 * @param {*} device_id
 * @param {*} controller_id
 * @param {*} date
 * @param {*} action
 * @param {*} callback
 */
function insertProgramation(device_id, controller_id, date, action, callback) {
    knex('programaciones').insert({fecha: date, action: action, controller_id: controller_id, dispositivo_id: device_id})
        .returning('id')
        .then(function (row) {
            callback(true);
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
            callback(false);
        })
}

// Enrutador
var router = express.Router();

/* -- RUTAS -- */

// Main
app.get('/', function(pet, resp){
   resp.status(200);
   resp.send({message: "Bienvenido a la API de domótica IberRally", loginUrl: "http://"+pet.headers.host+"/api/login"});
});

// Prefijo para todas las llamadas a la API
app.use('/api', router);

// Anyadir programacion
router.post('/casas/:id/controller/:controller_id/programacion', function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;

    console.log("POST /api/casas/"+houseId+"/controller/"+controllerId+"/programacion");

        if (houseId > 0 && controllerId > 0) {
            getHouse(houseId, function(house) {
                if (!house) {
                    resp.status(404);
                    resp.send({errMessage: "No se ha encontrado el inmueble "+houseId});

                } else {
                    getController(controllerId, function(controller) {
                        if (!controller) {
                            resp.status(404);
                            resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                        } else {
                            var dispositivoId = req.body.dispositivo_id;
                            var fecha = req.body.fecha;
                            var action = req.body.action;

                            if(dispositivoId && fecha && action) {
                                // Anyadimos programacion
                                insertProgramation(dispositivoId, controllerId, fecha, action, function(response) {
                                    if (response) {
                                        resp.status(200);
                                        resp.send({message: "Accion programada correctamente",
                                            url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});

                                    } else {
                                        resp.status(500);
                                        resp.send({errMessage: "Error al insertar la programacion"});
                                    }
                                });

                            } else {
                                resp.status(400);
                                resp.send({errMessage: "Parametros invalidos (id del dispositivo), (fecha), (accion)"});
                            }
                        }
                    });
                }
            });

        } else {
            console.log("Error: El id no es válido");
            resp.status(500);
            resp.send({errMessage: "El id proporcionado no es válido"})
        }
});

// Controlador completo de una habitacion
router.get('/casas/:id/controller/:controller_id', function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;

    console.log("GET /api/casas/"+houseId+"/controller/"+controllerId);

    if (houseId > 0 && controllerId > 0) {
        getHouse(houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el elemento "+houseId});

            } else {
                getController(controllerId, function(controller) {
                    if (!controller) {
                        resp.status(404);
                        resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                    } else {
                        var controllerName = controller.nombre;
                        var offset = parseInt(req.query.offset);
                        var json_result = {};

                        // Offset empieza desde 0
                        getDevices(controllerId, offset-1, function(devices) {
                            var result = [];
                            if (devices) {

                                // Por cada dispositivo
                                devices.forEach(function(element) {
                                    result.push({dispositivo_id: element.id, nombre: element.nombre,
                                        temperatura: element.temperatura,
                                        url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId+
                                                '/regulador/'+element.id});
                                }, this);
                            }

                            json_result = {id: controllerId, nombre: controllerName, casa_id: houseId,
                                dispositivos: result,
                                anyadir_dispositivo: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId,
                                siguiente: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId+'?offset='+(offset+1)};

                            resp.status(200);
                            resp.send(json_result);
                        });
                    }
                });
            }
        });

    } else {
        console.log("Error: El id no es válido");
        resp.status(500);
        resp.send({errMessage: "El id proporcionado no es válido"})
    }
});

// Anyadir un dispositivo a un controlador
router.post('/casas/:id/controller/:controller_id', checkAuth, function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;

    console.log("POST /api/casas/"+houseId+"/controller/"+controllerId);

    if (houseId > 0 && controllerId > 0) {
        getHouse(houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el inmueble "+houseId});

            } else {
                getController(controllerId, function(controller) {
                    if (!controller) {
                        resp.status(404);
                        resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                    } else {
                        var nombre = req.body.nombre;
                        if (!nombre) {
                            resp.status(400);
                            resp.send({errMessage: "Debes especificar un nombre para el dispositivo"});

                        } else {
                            insertDevice(controllerId, nombre, function (response) {
                                if (response) {
                                  console.log(response);
                                    resp.status(201);
                                    resp.send({message: "Dispositivo "+response+" creado correctamente",
                                        url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});

                                } else {
                                    resp.status(500);
                                    resp.send({errMessage: "Ha ocurrido un problema registrando el dispositivo"});
                                }
                            });
                        }
                    }
                });
            }
        });

    } else {
        console.log("Error: El id no es válido");
        resp.status(500);
        resp.send({errMessage: "El id proporcionado no es válido"});
    }
});

// Cambiar la temperatura de un regulador
router.put('/casas/:id/controller/:controller_id/regulador/:device_id', checkAuth, function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;
    var deviceId = req.params.device_id;
    console.log("PUT /api/casas/"+houseId+"/controller/"+controllerId+"/regulador/"+deviceId);

    if (houseId > 0 && controllerId > 0 && deviceId > 0) {
        getHouse(houseId, function(house) {
            getController(controllerId, function(controller) {
                // Actualizamos el dispositivo
                if (house && controller) {
                    var newTemperatura = req.body.temperatura;

                    // Comprobar si hay valor en el body y si la temperatura no es menor que el cero absoluto
                    if (!newTemperatura || newTemperatura < -273) {
                        resp.status(400);
                        resp.send({errMessage: "Debes especificar una temperatura válida para el dispositivo"});

                    } else {
                        // Actualiza temperatura
                        updateDevice(deviceId, newTemperatura, function(response) {
                            console.log("repsonse "+ response);
                            if (response) {
                                resp.status(200);
                                resp.send({nueva_temperatura: newTemperatura,
                                    url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});

                            } else {
                                resp.status(500);
                                resp.send({errMessage: "Ha ocurrido un problema actualizando el dispositivo"});
                            }
                        });
                    }

                } else {
                    resp.status(404);
                    resp.send({errMessage: "No se encuentra algunos de los elementos enviados"});
                }
            })
        });
    } else {
        console.log("Error: El id no es válido");
        resp.status(500);
        resp.send({errMessage: "El id proporcionado no es válido"});
    }
});

// Eliminar un dispositivo
router.delete('/casas/:id/controller/:controller_id/regulador/:device_id', checkAuth, function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;
    var deviceId = req.params.device_id;
    console.log("DELETE /api/casas/"+houseId+"/controller/"+controllerId+"/regulador/"+deviceId);

    if (houseId > 0 && controllerId > 0 && deviceId > 0) {
        getHouse(houseId, function(house) {
            getController(controllerId, function(controller) {
                // Actualizamos el dispositivo
                if (house && controller) {
                    deleteDevice(deviceId, function(response) {

                        if (response) {
                            resp.status(200);
                            resp.send({message: "Dispositivo "+deviceId+" eliminado correctamente",
                                url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});

                        } else {
                            resp.status(500);
                            resp.send({errMessage: "Ha ocurrido un problema eliminando el dispositivo"});
                        }
                    });
                } else {
                    resp.status(404);
                    resp.send({errMessage: "No se encuentra algunos de los elementos enviados"});
                }
            })
        });
    } else {
        console.log("Error: El id no es válido");
        resp.status(500);
        resp.send({errMessage: "El id proporcionado no es válido"});
    }
});

// Casas de un usuario
router.get('/casas', checkAuth, function(req, resp) {
    // Verificamos el usuario
    console.log('GET /api/casas');
    console.log(username);
    getCurrentUserId(username, function(res) {
        if (!res) {
            resp.status(500);
            resp.send({errMessage: "No estas autenticado!", url: "http://localhost:8080/api/login"});

        } else {
            var userId = res.id;
            knex('casas').select('id', 'nombre', 'poblacion', 'direccion', 'codigo_postal').where('user_id', userId)
                .then(function(rows) {
                    if (rows) {
                        var result = [];
                        resp.status(200);
                        rows.forEach(function(element) {
                            result.push({
                              id: element.id,
                              nombre: element.nombre,
                              direccion: element.direccion,
                              poblacion: element.poblacion,
                              codigo_postal: element.codigo_postal,
                              url: "http://"+req.headers.host+"/api/casas/"+element.id});
                        }, this);

                        var json = {casas: result};
                        resp.send(json);
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
                        result.push({
                          id: element.id,
                          nombre: element.nombre,
                          url: "http://"+req.headers.host+"/api/casas/"+houseId+"/controller/"+element.id});
                    }, this);

                    json_result = {
                      inmueble_id: houseId,
                      inmueble_nombre: house.nombre,
                      direccion: house.direccion,
                      poblacion: house.poblacion,
                      codigo_postal: house.codigo_postal,
                      controladores: result};
                    resp.status(200);
                    resp.send(json_result);
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

module.exports = app;

// Arranque del servidor
app.listen(process.env.PORT || port);
console.log("Escuchando por el puerto " + port);
