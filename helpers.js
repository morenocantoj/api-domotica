module.exports = {
  /**
    @param deviceId
    @param action
   */
  getProgramationType: function(device, action, date, callback) {
    console.log("GET PROGRAMATION TYPE")
    actionSplit = action.split(" ")
      switch (actionSplit[1]) {
        case "light":
          json = {
            'action': 'programation',
            'device': actionSplit[1],
            'port': device.port,
            'date': date,
            'value': actionSplit[2] == 'ON' ? true : false,
            'log': actionSplit[2] == 'ON' ? 'Dispositivo '+device.nombre+' activado' : 'Dispositivo '+device.nombre+' desactivado'
          }
          break;
        case "clima":
          console.log("Clima programation not implemented yet!")
          json = JSON.stringify({
            'action': 'programation',
            'device': actionSplit[1],
            'value': 'NOT_IMPLEMENTED'
          })
          break;
        default:
          console.log("Not implemented yet!")
          json = JSON.stringify({
            'action': 'programation',
            'value': "NOT_IMPLEMENTED"
          })
    }

    callback(json)
    return null;
  },

  /**
  * Update a light through Websocket communication
  * @param device affected device
  * @param controllerId raspian controller
  * @param newStatus new value status
  * @param connectedUsers new users connected
  */
  updateLightWS: function(device, controllerId, newStatus, connectedUsers) {
    console.log("Actualizando luz en Raspian...")

    // Cogemos la conexion establecida
    var ws = connectedUsers.get(controllerId)
    var newLight = JSON.stringify({
      'action': 'light',
      'port': device.port,
      'value': newStatus
    })

    // Enviamos nuevas instrucciones a raspian
    ws.send(newLight)
  },

  /**
  * Get current url with protocol and port
  * @param req current request
  */
  getFullUrl: function(req) {
    var fullUrl = req.protocol + '://' + req.get('host');
    return fullUrl
  },
}
