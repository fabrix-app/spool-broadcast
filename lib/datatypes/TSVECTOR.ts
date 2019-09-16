import { DataTypes } from 'sequelize'


class TSVECTOR extends DataTypes.ABSTRACT {
  public key: string

  constructor (value?) {
    super()
    this.key = 'TSVECTOR'
  }

  toSql() {
    return 'tsvector'
  }

  // Todo
  validate (value) {
    // const Validator = require('./utils/validator-extras').validator;
    // if (!Validator.isDate(String(value))) {
    //   throw new sequelizeErrors.ValidationError(util.format('%j is not a valid date', value));
    // }
    return true
  }

  _sanitize (value) {
    return new TSVECTOR(value)
  }

  _isChanged (value, originalValue) {
    return value !== originalValue
  }

  _stringify (value) {
    return value
  }
}


DataTypes.TSVECTOR = TSVECTOR
