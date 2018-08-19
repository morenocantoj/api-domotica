// Dependencias
var express = require('express');
var bodyparser = require('body-parser');
var jwt = require('jwt-simple');
var moment = require('moment'); // Fechas
var url = require('url');
var cors = require('cors');
var db = require('./database.js')
var helpers = require('./helpers.js')
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const SocketServer = require('ws').Server;
var connectedUsers = new Map()

var app = express();
app.use(cors());
var port = 3000;
var secret = '123456'; // Secret key para JWT

app.use( bodyparser.json() );       // to support JSON-encoded bodies
app.use(bodyparser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Environment BBDD credentials
if (process.env.NODE_ENV === 'development') {
  var knex = require('knex')({
      client: 'mysql',
      connection: {
          host: '127.0.0.1',
          user: 'domotik',
          password: 'domotik',
          database: 'domotik'
      },
      acquireConnectionTimeout: 10000
  });
} else if (process.env.NODE_ENV === 'test') {
  var knex = require('knex')({
      client: 'mysql',
      connection: {
          host: '127.0.0.1',
          user: 'root',
          password: '',
          database: 'test'
      },
      acquireConnectionTimeout: 10000
  });
} else {
  var knex = require('knex')({
      client: 'mysql',
      connection: {
          host: 'us-cdbr-iron-east-04.cleardb.net',
          user: 'b563275015a965',
          password: 'c08e1098',
          database: 'heroku_b965ba85a525123'
      },
      acquireConnectionTimeout: 10000
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
            db.getHouse(knex, houseId, function(house) {
                if (!house) {
                    resp.status(404);
                    resp.send({errMessage: "No se ha encontrado el inmueble "+houseId});

                } else {
                    db.getController(knex, controllerId, function(controller) {
                        if (!controller) {
                            resp.status(404);
                            resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                        } else {
                            var dispositivoId = req.body.dispositivo_id;
                            var fecha = req.body.fecha;
                            var action = req.body.action;

                            if(dispositivoId && fecha && action) {
                                // Anyadimos programacion
                                db.insertProgramation(knex, dispositivoId, controllerId, fecha, action, function(response) {
                                    if (response) {
                                      // Event emitter
                                      let message = "Dispositivo " + deviceId + " programado"

                                      db.insertEvent(knex, controllerId, message, function (eventId) {
                                        resp.status(200);
                                        resp.send({message: "Accion programada correctamente",
                                            url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});
                                      })

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
        db.getHouse(knex, houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el elemento "+houseId});

            } else {
                db.getController(knex, controllerId, function(controller) {
                    if (!controller) {
                        resp.status(404);
                        resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                    } else {
                        var controllerName = controller.nombre;
                        var offset = parseInt(req.query.offset);
                        var json_result = {};

                        // Offset empieza desde 0
                        db.getDevices(knex, controllerId, offset-1, function(devices) {
                            var result = [];
                            if (devices) {

                                // Por cada dispositivo
                                devices.forEach(function(element) {
                                    result.push({
                                      dispositivo_id: element.id,
                                      nombre: element.nombre,
                                      temperatura: element.temperatura,
                                      port: element.port,
                                      status: element.status,
                                      tipo: element.tipo,
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

router.get('/casas/:id/controller/:controller_id/eventos', function (req, resp) {
  var controllerId = req.params.controller_id

  if (controllerId > 0) {
    // Get events
    db.getEvents(knex, controllerId, function (rows) {
      if (!rows) {
        resp.status(500);
        resp.send({errMessage: "¡Ha ocurrido un error en el servidor!"});

      } else {
        var result = [];
        resp.status(200);
        rows.forEach(function(element) {
          result.push({
            id: element.id,
            fecha: element.fecha,
            message: element.message,
            controller_id: element.controller_id
          });
          }, this);
          var json = {eventos: result};
          resp.send(json);
      }
    })

  } else {
    resp.status(400);
    resp.send({errMessage: "El id proporcionado no es válido"});
  }
})

// Get pending programations
router.get('/casas/:id/controller/:controller_id/programaciones', function (req, resp) {
  var controllerId = req.params.controller_id
  var date
  if (!req.query.date) {
    date = moment("YYYY-MM-DD HH:mm:ss")
  } else {
    date = moment(req.query.date, "DD-MM-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
  }

  if (controllerId > 0) {
    // Get programations
    db.getProgramations(knex, controllerId, date, function (rows) {
      if (!rows) {
        resp.status(500);
        resp.send({errMessage: "¡Ha ocurrido un error en el servidor!"});

      } else {
        var result = [];
        resp.status(200);
        rows.forEach(function(element) {
          result.push({
            id: element.id,
            fecha: element.fecha,
            action: element.action,
            controller_id: element.controller_id,
            dispositivo_id: element.dispositivo_id,
            log: element.log
          });
          }, this);
          var json = {programaciones: result};
          resp.send(json);
      }
    })

  } else {
    resp.status(400);
    resp.send({errMessage: "El id proporcionado no es válido"});
  }
})

// Anyadir un dispositivo a un controlador
router.post('/casas/:id/controller/:controller_id', checkAuth, function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;

    console.log("POST /api/casas/"+houseId+"/controller/"+controllerId);

    if (houseId > 0 && controllerId > 0) {
        db.getHouse(knex, houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el inmueble "+houseId});

            } else {
                db.getController(knex, controllerId, function(controller) {
                    if (!controller) {
                        resp.status(404);
                        resp.send({errMessage: "No se ha encontrado el controlador "+controllerId});

                    } else {
                        var nombre = req.body.nombre
                        var port = req.body.port
                        var type = req.body.type

                        if (!nombre || !port || !type) {
                            resp.status(400);
                            resp.send({errMessage: "Debes especificar un nombre, puerto GPIO y tipo para el dispositivo"});

                        } else if (type.localeCompare("light") !== 0 && type.localeCompare("clima") !== 0) {
                          resp.status(400);
                          resp.send({errMessage: "Debes especificar un tipo adecuado para el dispositivo. Los soportados son light y clima"});

                        } else {
                            db.insertDevice(knex, controllerId, nombre, port, type, function (response) {
                                if (response) {
                                  // Event emitter
                                  let message = "Creado nuevo dispositivo: " + req.body.nombre

                                  db.insertEvent(knex, controllerId, message, function (eventId) {
                                    resp.status(201);
                                    resp.send({message: "Dispositivo "+response+" creado correctamente",
                                        url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});
                                  })

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

// Cambiar el estado de una conexion (luz, enchufe, etc)
router.put('/casas/:id/controller/:controller_id/luz/:device_id', checkAuth, function(req, resp) {
  // Cogemos el inmueble
  var houseId = req.params.id;
  var controllerId = req.params.controller_id;
  var deviceId = req.params.device_id;
  console.log("PUT /api/casas/"+houseId+"/controller/"+controllerId+"/luz/"+deviceId);

  if (houseId > 0 && controllerId > 0 && deviceId > 0) {
      db.getHouse(knex, houseId, function(house) {
          db.getController(knex, controllerId, function(controller) {
              // Actualizamos el dispositivo
              if (house && controller) {
                  var newStatus = req.body.status;

                  // Comprobar si hay valor en el body y si la temperatura no es menor que el cero absoluto
                  if (newStatus == null) {
                      resp.status(400);
                      resp.send({errMessage: "Debes especificar un estado válido para el dispositivo (true | false)"});

                  } else {
                      db.getDevice(knex, deviceId, function (response) {

                        // Actualiza luz en raspberry
                        helpers.updateLightWS(response, controllerId, newStatus, connectedUsers)

                        // Actualiza luz en BBDD
                        db.updateLight(knex, deviceId, newStatus, function(response) {

                            if (response) {
                              // Event emitter
                              let message
                              newStatus ? message = "Dispositivo " + deviceId + " activado"
                                        : message = "Dispositivo " + deviceId + " apagado"
                              db.insertEvent(knex, controllerId, message, function (eventId) {
                                resp.status(200);
                                resp.send({status: newStatus,
                                    url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});
                              })

                            } else {
                                resp.status(500);
                                resp.send({errMessage: "Ha ocurrido un problema actualizando el dispositivo"});
                            }
                        });
                      })
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

// Cambiar la temperatura de un regulador
router.put('/casas/:id/controller/:controller_id/regulador/:device_id', checkAuth, function(req, resp) {
    // Cogemos el inmueble
    var houseId = req.params.id;
    var controllerId = req.params.controller_id;
    var deviceId = req.params.device_id;
    console.log("PUT /api/casas/"+houseId+"/controller/"+controllerId+"/regulador/"+deviceId);

    if (houseId > 0 && controllerId > 0 && deviceId > 0) {
        db.getHouse(knex, houseId, function(house) {
            db.getController(knex, controllerId, function(controller) {
                // Actualizamos el dispositivo
                if (house && controller) {
                    var newTemperatura = req.body.temperatura;

                    // Comprobar si hay valor en el body y si la temperatura no es menor que el cero absoluto
                    if (!newTemperatura || newTemperatura < -273) {
                        resp.status(400);
                        resp.send({errMessage: "Debes especificar una temperatura válida para el dispositivo"});

                    } else {
                        // Actualiza temperatura
                        db.updateDevice(knex, deviceId, newTemperatura, function(response) {
                            if (response) {
                              // Event emitter
                              let message = "Dispositivo " + deviceId + " puesto a " + newTemperatura

                              db.insertEvent(knex, controllerId, message, function (eventId) {
                                resp.status(200);
                                resp.send({nueva_temperatura: newTemperatura,
                                    url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});
                              })

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
        db.getHouse(knex, houseId, function(house) {
            db.getController(knex, controllerId, function(controller) {
                // Actualizamos el dispositivo
                if (house && controller) {
                    db.deleteDevice(knex, deviceId, function(response) {

                        if (response) {
                          // Emit the action
                          let message = "Dispositivo " + deviceId + " eliminado del sistema"
                          db.insertEvent(knex, controllerId, message, function(eventId) {
                            resp.status(200);
                            resp.send({message: "Dispositivo "+deviceId+" eliminado correctamente",
                                url: 'http://'+req.headers.host+'/casa/'+houseId+'/controller/'+controllerId});
                          })
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
    return db.getCurrentUserId(knex, username, function(res) {
        if (!res) {
            resp.status(500);
            resp.send({errMessage: "No estas autenticado!", url: "http://localhost:8080/api/login"});

        } else {
            var userId = res.id;
            db.getHouses(knex, userId, function(rows) {
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
        db.getHouse(knex, houseId, function(house) {
            if (!house) {
                resp.status(404);
                resp.send({errMessage: "No se ha encontrado el elemento "+houseId});

            } else {
                var result = [];

                // Buscar controladores de la casa
                db.getControllers(knex, houseId, function(controllers) {

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

    var loginName = req.body.login.toLowerCase();
    var password = req.body.password;

    db.login(knex, loginName, password, function(result) {
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

router.post('/register', function(req, resp) {
  var loginName = req.body.login.toLowerCase();
  var password = req.body.password;

  // Check minimun register fields
  if (loginName.length > 4 && password.length > 4) {
    db.register(knex, loginName, password, function(result) {
      if (!result) {
        // User ya existente
        resp.status(406);
        resp.send({errMessage: "Usuario ya existente en la base de datos"});

      } else if (result != null) {
        resp.status(201);
        resp.send({message: "Registro completado"});

      } else {
        resp.status(500);
        resp.send({errMessage: "¡Error al realizar el registro!"});
      }
    });

  } else {
    resp.status(400);
    resp.send({errMessage: "El nombre de usuario y contraseña deben tener una longitud superior a 4 caracteres"});
  }
})

/* -- /RUTAS -- */

module.exports = app;

console.log("¡Esto es una rama de prueba!")

// Arranque del servidor
var server = app.listen(process.env.PORT || port);
const wss = new SocketServer({ server });

//init Websocket ws and handle incoming connect requests
wss.on('connection', function connection(ws) {
    console.log("connection ...");

    //on connect message
    ws.on('message', function incoming(message) {
        // Conectamos una conexion con el ID de raspberry
        message = JSON.parse(message)

        switch (message.type) {
          case 'CLOSE':
            // Liberate space
            console.log("Liberando controlador...")
            connectedUsers.delete(message.msg)
            break;
          case 'CONNECTION':
            // Connect Raspian
            console.log("Conectando controlador...")
            connectedUsers.set(message.msg, ws)
            break;
          case 'PING':
            // Keep alive the connection!
            break;
          default:
            console.log("No se reconoce la expresion")
        }
    });

    ws.on('close', function(connection) {
      // Close connection
      console.log("Conexion cerrada desde Raspian")
    })
});

console.log("Escuchando por el puerto " + port);
