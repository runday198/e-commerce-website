const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Product = sequelize.define(
  "product",
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fullDesc: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    shortDesc: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    storageQuantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    paranoid: true,
  }
);

module.exports = Product;
