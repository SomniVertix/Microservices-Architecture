/**
 * Index file for all api functions
 * This file MUST exactly match the names of the functions both inside
 * of it and the function that it will be named in server.js, otherwise
 * gRPC will not recognize the function (for some reason?)
 */

const PrintData = require("./PrintData")

module.exports = {
    PrintData
}