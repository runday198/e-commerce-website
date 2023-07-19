const httpStatusCodes = require("./httpStatusCodes");
const BaseError = require("./baseError");

class Api404Error extends BaseError {
  constructor(
    name,
    statusCode = httpStatusCodes.NOT_FOUND,
    description = "Not Found.",
    isOperational = true
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = Api404Error;
