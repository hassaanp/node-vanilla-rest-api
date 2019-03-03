/**
 * These are the helpers for various tasks
 */

//  Dependencies
const crypto = require('crypto');
const config = require('./../config');
// Container for all the helpers
helpers = {};

// Create a SHA256 hash
helpers.hash = (str)=>{
    if (typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse the json string to an object without throwing
helpers.parseJsonToObject = (str)=>{
    try{
        return JSON.parse(str);
    } catch (error){
        return false;
    }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength)=>{
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all possible characters that could go in the string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';

        // Start the final string
        let str = '';

        for(i=0; i < strLength; i++){
            // Get a random character from the possibleCharacters string
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str += randomCharacter;
        }
        return str;
    } else {
        return false;        
    }
}

//  Export the module
module.exports = helpers;