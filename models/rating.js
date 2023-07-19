const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Rating = sequelize.define("rating", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  stars: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = Rating;
