/**
 * Entry point for the API
 * 
 */

 // Dependencies

const http = require('http');
const https = require('https');
const { URL } = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
console.log("using the environment: ", config);

// Instantiate the http server
const httpServer = http.createServer((req, res)=>{
    unifiedServer(req,res);
});

// Start the http server
httpServer.listen(config.httpPort, ()=>{
    console.log(`The server is listening on port ${config.httpPort} in ${config.name} now`);
});

// define the httpsServerOptions object
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}

// Instantiate the https server
const httpsServer = https.createServer(httpsServerOptions, (req, res)=>{
    unifiedServer(req,res);
});

// Start the https server
httpsServer.listen(config.httpsPort, ()=>{
    console.log(`The server is listening on port ${config.httpsPort} in ${config.name} now`);
});

// All the server logic for both the http and https server
const unifiedServer = (req, res)=>{
    // Get the URL and parse it
    const base = new URL('http://localhost:'+config.httpPort);
    const parsedUrl = new URL(req.url, base);
    console.log(req.url);
    
    // Get path from the URL
    let path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/|\/$/g, '');

    // Get the HTTP Method
    const method = req.method.toLowerCase();

    // Get the Query Params
    let queryParams = {};
    for(var key of parsedUrl.searchParams.keys()){
        queryParams[key] = parsedUrl.searchParams.get(key);
    }
    // Get the headers
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data)=>{
        buffer += decoder.write(data);
    });

    req.on('end', ()=>{
        buffer += decoder.end();
        console.log('trimmedPath:',trimmedPath);
        // choose handler that this request should go to. If one is not found, use the not found handler
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        // construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryParams': queryParams,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        //  route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            //  Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
        
            // use the payload called back by the handler or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // convert the payuload to a string
            let payloadString = JSON.stringify(payload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });

    // Log the path that was requested
    console.log('Request received on path: ', trimmedPath);
    console.log('With method: ' + method);
    console.log('And params: ', queryParams);
    console.log('With headers', headers);
}

// Define a request router
const router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
};