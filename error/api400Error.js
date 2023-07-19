const httpStatusCodes = require("./httpStatusCodes");
const BaseError = require("./baseError");

class Api400Error extends BaseError {
  constructor(
    name,
    statusCode = httpStatusCodes.BAD_REQUEST,
    isOperational = false,
    description = "Incorrect Input"
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = Api400Error;
