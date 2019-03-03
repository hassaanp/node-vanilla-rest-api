/**
 * Library for storing and editing data
 * 
 */

//  Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module to be exported
const lib = {};

// Define the base directory for the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = (dir, file, data, callback)=>{
    // Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fileDescriptor)=>{
        if(!err && fileDescriptor){
            // Convert data to string
            let stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err)=>{
                if (!err){
                    fs.close(fileDescriptor, (err)=>{
                        if(!err){
                            callback(false);
                        } else{
                            callback('Error closing new file');
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback('Could not create a new file, it may already exist');
        }
    });
};

// Read data from a file
lib.read = (dir, file, callback)=>{
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data)=>{
        if(!err && data){
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else{
            callback(err, data);
        }
    })
}

// Updata data in a file
lib.update = (dir, file, data, callback)=>{
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', (err, fileDescriptor)=>{
        if(!err && fileDescriptor){
            let stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, (err)=>{
                if(!err){
                    fs.writeFile(fileDescriptor, stringData, (err)=>{
                        if(!err){
                            fs.close(fileDescriptor, (err)=>{
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Could not close the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file');
                        }
                    })
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    })
}

lib.delete = (dir, file, callback)=>{
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err)=>{
        if(!err){
            callback(false);
        } else {
            callback('Could not delete the file');
        }
    });
}
// Export the module
module.exports = lib;