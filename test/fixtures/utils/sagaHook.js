const sagaHook = function(endpoint, command) {
  return [endpoint, command]
}

module.exports = sagaHook
