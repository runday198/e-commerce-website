const httpStatusCodes = require("./httpStatusCodes");
const BaseError = require("./baseError");

class Api500Error extends BaseError {
  constructor(
    name,
    statusCode = httpStatusCodes.INTERNAL_SERVER,
    description = "Internal Error",
    isOperational = false
  ) {
    super(name, description, statusCode, isOperational);
  }
}

module.exports = Api500Error;
