import {regexdot } from '@fabrix/regexdot'

export const pattern = {

  run: (route, path, loose = false ) => {
    let i = 0, out = {}, result = regexdot(route, !!loose)
    let matches = result.pattern.exec(path)
    if (matches === null) {
      return false
    }
    if (matches.groups) {
      return matches.groups
    }
    while (i < result.keys.length) {
      out[result.keys[i]] = matches[++i] || null
    }
    return out
  },

  toExec: function (route, path, params) {
    let out = pattern.run(route, path)
    return out
  }
}

// export const toExec = function (route, path, params) {
//   let out = run(route, path)
//   return params
// }
