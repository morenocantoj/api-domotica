var jwt = require('jwt-simple');
var helpers = require('./helpers.js')
var bcrypt = require('bcryptjs');
var moment = require('moment'); // Fechas
var secret = '123456'; // Secret key para JWT

return module.exports = {
  // Metodo de login
  login: function(knex, login, password, callback) {

      knex('usuarios').where({login: login}).select('login', 'password')
          .then(function (row) {
            // Check if user exists
            if (row.length <= 0) {
              return callback(false)
            }
            // Check if password matches
            if (row[0].login.toLowerCase() === login && bcrypt.compareSync(password, row[0].password)) {
                console.log("Login usuario correcto: " + login);

                var payload = {
                    login: row[0].login,
                    exp: moment().add(7, 'days').valueOf()
                }
                var token = jwt.encode(payload, secret);
                return callback(token);
            } else {
                console.log("Login no correcto");
                return callback(false)
            }
          })
          .catch(function (err) {
              console.log("Error: ");
              console.log(err)
              return callback(false);
          });
  },

  /**
  * Registro de un nuevo usuario
  * @param login nombre de usuario
  * @param password contraseña a hashear
  * @param callback funcion callback
  */
  register: function(knex, login, password, callback) {
    var query = knex('usuarios').returning('id')

    passwordHash = bcrypt.hashSync(password, 8);

    // Check si usuario existe ya
    knex('usuarios').where({login: login}).select('login')
    .then(function (row) {

      if (row.length == 0) {
        query.insert({login: login, password: passwordHash})
        .then(function (id) {
          console.log("Usuario "+login+" registrado correctamente en la aplicacion")
          return callback(id)
        })
        .catch(function (err) {
          console.log("Error: " + err)
          return callback(null)
        })

      } else {
        // User existente
        return callback(false)
      }
    })
  },

  /**
  * Gets an user details
  * @param userId existing user ID in database
  */
  getUser: function(knex, userId, callback) {
    knex('usuarios').where({id: userId}).select('login').first()
    .then(function (row) {
      callback(row)
      return null
    })
    .catch(function (err) {
      console.log("Error obteniendo datos del usuario " + userId)
      console.log(err)
      callback(null)
      return null
    })
  },

  /**
   * Consigue el ID del usuario actual comprobando el token
   * @param {*} token token pasado por parametro
   * @param {*} callback function callback
   */
  getCurrentUserId: function(knex, user, callback) {
    console.log(user)
      return knex('usuarios').where('login', user).column('id').then(function (row) {
              user = row[0];
              callback(user);
              return null;
          })
          .catch(function (err) {
              console.log("Error: " + err);
              callback(false);
              return null;
          });
  },

  /**
   * Devuelve todos los datos de una casa
   * @param {*} id de la casa
   * @param {*} callback function callback
   */
  getHouses: function(knex, userId, callback) {
      knex('casas').where('user_id', userId).column('id', 'nombre', 'direccion', 'codigo_postal', 'poblacion')
          .then(function(rows) {
              return callback(rows);
          })
          .catch(function (err) {
              console.log("Error: " + err);
              return false;
          })
  },

  /**
   * Devuelve todos los datos de una casa
   * @param {*} id de la casa
   * @param {*} callback function callback
   */
  getHouse: function(knex, id, callback) {
      knex('casas').where('id', id).column('id', 'nombre', 'direccion', 'codigo_postal', 'poblacion')
          .then(function(row) {
              // Solo es posible tener una entrada
              callback(row[0]);
              return null;
          })
          .catch(function (err) {
              console.log("Error: " + err);
              return false;
          })
  },

  /**
   * Devuelve todos los controladores de una casa
   * @param {*} house_id
   * @param {*} callback
   */
  getControllers: function(knex, house_id, callback) {
      knex('controladores').where('casa_id', house_id).column('id', 'nombre')
          .then(function (rows) {
              return callback(rows);
          })
          .catch(function (err) {
              console.log("Error: " + err);
              return false;
          })
  },

  /**
   * Devuelve todos los dispositivos asociados a un controlador
   * @param {*} controller_id
   * @param {*} callback
   */
  getDevices: function(knex, controller_id, offset, callback) {
    var limit = 5;
    var query = knex('dispositivos').where('controller_id', controller_id).column('id', 'nombre', 'temperatura',
    'tipo', 'port', 'status')

    // If client wants to paginate
    if (!isNaN(offset)) {
      query = query.limit(limit).offset(offset*5)
    }

    query.then(function (rows) {
        return callback(rows);
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
        return false;
    })
  },

  getDevice: function(knex, deviceId, callback) {
    console.log("GET device")
    var query = knex('dispositivos').where('id', deviceId).column('id', 'nombre', 'temperatura',
    'tipo', 'port', 'status')

    query.then(function (rows) {
        callback(rows[0]);
        return null;
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
        return false;
    })
  },

  /**
   * Devuelve un controlador asociado a una casa con todos sus dispositivos
   * @param {*} controller_id
   * @param {*} callback
   */
  getController: function(knex, controller_id, callback) {
      knex('controladores').where('id', controller_id).column('id', 'nombre', 'casa_id')
          .then(function (rows) {
              callback(rows[0]);
              return null;
          })
          .catch(function (err) {
              console.log("Error: " + err.message);
              return false;
          });
  },

  /**
   * Inserta un dispositivo en un controlador de una casa
   * @param {*} controller
   * @param {*} name
   * @param {*} callback
   */
  insertDevice: function(knex, controller, name, port, type, callback) {
    var query = knex('dispositivos').returning('id')

    switch (type) {
      case "light":
        query = query.insert({temperatura: 0, nombre: name, tipo: type, port: port, controller_id: controller})
        break;
      case "clima":
        query = query.insert({temperatura: 21, nombre: name, port: port, tipo: type, controller_id: controller})
    }

    query.then(function (rows) {
        callback(rows[0]);
        return null;
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
        return false;
    });
  },

  /**
   * Actualiza la temperatura de un regulador
   * @param {*} device_id
   * @param {*} newValue
   * @param {*} callback
   */
  updateDevice: function(knex, device_id, newValue, callback) {
      knex('dispositivos').where('id', device_id).update('temperatura', newValue)
      .then(function (rows) {
          return callback(rows);
      })
      .catch(function (err) {
          console.log("Error: " + err.message);
          return false;
      });
  },

  /**
   * Actualiza el estado de una conexion de luz
   * @param {*} device_id
   * @param {*} newValue
   * @param {*} callback
   */
  updateLight: function(knex, device_id, newValue, callback) {
      knex('dispositivos').where('id', device_id).update('status', newValue)
      .then(function (rows) {
          return callback(rows);
      })
      .catch(function (err) {
          console.log("Error: " + err.message);
          return false;
      });
  },

  /**
   * Borra un dispositivo
   * @param {*} device_id
   * @param {*} callback
   */
  deleteDevice: function(knex, device_id, callback) {
      knex('dispositivos').where('id', device_id).del()
          .then(function (row) {
              callback(row);
              return null;
          })
          .catch(function (err) {
              console.log("Error: " + err.message);
              return false;
          })
  },

  /**
   * Inserts a programation into a device
   * @param {*} device_id
   * @param {*} controller_id
   * @param {*} date
   * @param {*} action
   * @param {*} callback
   * @param {*} ws
   */
  insertProgramation: function(knex, device_id, controller_id, date, action, connectedUsers, callback) {
    console.log("INSERT PROGRAMATION")
    module.exports.getDevice(knex, device_id, function(device) {

      helpers.getProgramationType(device, action, date, function (newProgramation) {

        // Cogemos la conexion establecida
        var ws = connectedUsers.get(controller_id)

        // Envio de nueva programacion
        ws.send(JSON.stringify(newProgramation))

        knex('programaciones').insert({
          fecha: date,
          action: action,
          controller_id: controller_id,
          dispositivo_id: device_id,
          //log: newProgramation.log
        }).returning('id')
            .then(function (row) {
                return callback(true);
            })
            .catch(function (err) {
                console.log("Error: " + err);
                return callback(false);
            })
      })
    })
  },

  /**
  * Get all programations pending from a controller
  * @param knex BBDD helper
  * @param controllerId controller ID
  * @param minDate minimun date for searching of
  * @param callback callback function
  */
  getProgramations: function(knex, controllerId, minDate, callback) {
    console.log("GET PROGRAMATIONS")

    knex('programaciones').where('controller_id', controllerId).where('fecha', '>=', minDate)
    .then(function (rows) {
      return callback(rows)
    })
    .catch(function (err) {
      console.log(err)
      return callback(false)
    })
  },

  /**
  * Inserts an event happened in system
  * @param knex
  * @param controllerId ID of the controller where happened the event
  * @param message What it happened
  */
  insertEvent: function(knex, controllerId, message, callback) {
    var date = moment().format('YYYY-MM-DD HH:mm')

    knex('eventos').insert({
      log: message,
      fecha: date,
      controller_id: controllerId
    }).returning('id')
    .then(function (id) {
      return callback(true)
    })
    .catch(function (err) {
      console.log("Error " + err)
      return callback(false)
    })
  },

  /**
  * Get all events from a controller
  * @param knex BBDD helper
  * @param controllerId controller ID
  * @param callback callback function
  */
  getEvents: function(knex, controllerId, callback) {
    console.log("GET EVENTS")

    knex('eventos').where('controller_id', controllerId)
    .then(function (rows) {
      return callback(rows)
    })
    .catch(function (err) {
      console.log(err)
      return callback(false)
    })
  }
}
