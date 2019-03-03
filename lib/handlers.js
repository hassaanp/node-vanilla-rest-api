/**
 * These are the request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define handlers
let handlers = {};

// Users handler
handlers.users = (data, callback)=>{
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the user submethods
handlers._users = {};

// Users GET
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Prevent unauthorized access
handlers._users.get = (data, callback)=>{
    // Check that the phone number is valid
    let phone = typeof(data.queryParams.phone) == 'string' && data.queryParams.phone.trim().length == 10 ? data.queryParams.phone.trim() : false;
    if (phone) {
        // Get the token form headers
        const token = typeof(data.headers.token) == 'string' ?  data.headers.token : false;
        // Verify the token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (valid)=>{
            if(valid){
                // Lookup user
                _data.read('users', phone, (err,data)=>{
                    if(!err && data) {
                        // Remove the hashed password from user object
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'Error': 'Invalid token'});
            }
        })
    } else {
        callback(400, {Error: 'Missing required field'});
    }
};

// Users POST
// Required data: firstName, LastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback)=>{
    console.log(data.payload);
    // Check all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    const requiredFields = firstName && lastName && phone && password && tosAgreement;

    if(requiredFields){
        // Make sure the user does not already exist
        _data.read('users', phone, function(err,data){
            if(err){
                // Hash the password
                let hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword){
                    let userObject = {
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        hashedPassword: hashedPassword,
                        tosAgreement: true
                    };
    
                    // Write to file
                    _data.create('users', phone, userObject, (error)=>{
                        if(!error){
                            callback(200);
                        } else {
                            console.log(error);
                            callback(500, {'Error': 'Could not create a new user'});
                        }
                    })
                } else {
                    callback(500, {'Error': 'Could not hash password'});
                }
            } else {
                callback(400, {'Error': 'A user with that phone number already exists'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users PUT
// Required data: phone
// Optional data: firstName, lastName, password (atleast one must be specified)
// @TODO Only let an authenticated user update their own data object
handlers._users.put = (data, callback)=>{
    // Check for the required fields
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    // Error if phone is invalid
    if (phone){
        // Get the token form headers
        const token = typeof(data.headers.token) == 'string' ?  data.headers.token : false;
        // Verify the token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (valid)=>{
            if(valid){
                if(firstName  || lastName || password) {
                    _data.read('users', phone, (err, userData)=>{
                        if(!err && userData){
                            // Update the necessary fields
                            for(field in data.payload){
                                if(field != 'phone'){
                                    if(field == 'password'){
                                        userData.hashedPassword = helpers.hash(data.payload.password);
                                    } else {
                                        userData[field] = data.payload[field];
                                    }
                                }
                            }
                            _data.update('users', phone, userData, (err)=>{
                                if(!err){
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'The specified user does not exist.'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Nothing to update'});
                }
            }else{
                callback(403, {'Error': 'Invalid token'});
            }
        });
        // Error if nothing is sent to update
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
};

// Users DELETE
// Required field: phone
// @TODO Only let an authenticated user delete their object.
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback)=>{
    // Check that the phone number is valid
    let phone = typeof(data.queryParams.phone) == 'string' && data.queryParams.phone.trim().length == 10 ? data.queryParams.phone.trim() : false;
    if (phone) {
        // Get the token form headers
        const token = typeof(data.headers.token) == 'string' ?  data.headers.token : false;
        // Verify the token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (valid)=>{
            if(valid){
                // Lookup user
                _data.read('users', phone, (err,data)=>{
                    if(!err && data) {
                        // Remove the hashed password from user object
                        _data.delete('users', phone, (err)=>{
                            if(!err){
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Could not find the specified user'});
                    }
                });
            }else{
                callback(403, {'Error': 'Invalid token'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
};

// Token handler
handlers.tokens = (data, callback)=>{
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for token submethods
handlers._tokens = {}

// Token - POST
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback)=>{
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        // Lookup the user who matches the phone number
        _data.read('users', phone, (err, userData)=>{
            if(!err && userData){
                // Hash the sent password and compare to password stored in the useObject
                if(userData.hashedPassword == helpers.hash(password)){
                    // if valid, create a new token with a random name. Set expirate time of 1 hour from now
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000*60*60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (err)=>{
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Incorrect password'});
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field(s)'});
    }
};

// Token - GET
// Required data: tokenId
// Optional data: none
handlers._tokens.get = (data, callback)=>{
    // Check the token Id is valid or not
    const tokenId = typeof(data.queryParams.tokenId) == 'string' && data.queryParams.tokenId.trim().length == 20 ? data.queryParams.tokenId.trim() : false;

    if (tokenId) {
        _data.read('tokens', tokenId, (err, tokenData)=>{
            if (!err && tokenData){
                callback(200, tokenData);
            } else {
                callback(404, {'Error': 'Token is invalid'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required parameters'});
    }
};

// Token - PUT
// Required data: tokenId, extend
// Optional data: none
handlers._tokens.put = (data, callback)=>{
    // Check the required fields
    const tokenId = typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20 ? data.payload.tokenId.trim() : false;
    const password = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

    if (tokenId && password){
        _data.read('tokens', tokenId, (err, tokenData)=>{
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000*60*60;
                    _data.update('tokens', tokenId, tokenData, (err)=>{
                        if(!err){
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update the token\'s expiration'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Token has already expired and cannot be extended'});
                }
            } else {
                callback(400, {'Error': 'Specified token does not exist.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Token - DELETE
handlers._tokens.delete = (data, callback)=>{
    // Check that the phone number is valid
    let tokenId = typeof(data.queryParams.tokenId) == 'string' && data.queryParams.tokenId.trim().length == 20 ? data.queryParams.tokenId.trim() : false;
    if (tokenId) {
        // Lookup token
        _data.read('tokens', tokenId, (err,data)=>{
            if(!err && data) {
                // Remove the hashed password from user object
                _data.delete('tokens', tokenId, (err)=>{
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400, {'Error': 'Token does not exist'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
};

// Verify Token
handlers._tokens.verifyToken = (tokenId, phone, callback)=>{
    // Lookup the token
    _data.read('tokens', tokenId, (err, tokenData)=>{
        if (!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

// Ping handler
handlers.ping = (data, callback)=>{
    callback(200);
};

// Not found handler
handlers.notFound = (data, callback)=>{
    callback(404);
};

// Export the module
module.exports = handlers;