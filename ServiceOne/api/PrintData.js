/**
 * 
 * @param {*} call 
 * @param {*} callback 
 */
const PrintData = (call, callback) => {
    console.log("Request Recieved From:", call.request.name);
    callback(null, { message: "I am a response from Server One" } /* DataReply Object */);
}

module.exports = PrintData;