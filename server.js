const Hapi = require('hapi');
const pg = require('pg');
const Path = require('path');

const conString = "postgres://testuser:password@localhost:5432/leaderboard";

const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    }
});
server.connection({port: 3000});

var tableModel = {
	cols: ["Name", "Age"],
	rows: [{
		"Name": "Chase",
		"Age": "27"
		},
		{	
		"Name": "Ben",
		"Age": "23"
		}]
}

var response = {
	cols: ["username", "points", "state", "university"],
	rows: []		
}

server.register(require('inert'), (err) => {

    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.file('index.html');
        }
    });

    server.route({
    	method: 'GET',
    	path: '/leaderboard',
    	handler: function (request, reply) {
    		pg.connect(conString, function(err, client, done) {

				var handleError = function(err) {
		    	// no error occurred, continue with the request
		    		if(!err) return false;

		    		// An error occurred, remove the client from the connection pool.
		    		// A truthy value passed to done will remove the connection from the pool
		    		// instead of simply returning it to be reused.
		    		// In this case, if we have successfully received a client (truthy)
		    		// then it will be removed from the pool.
		    		if(client){
		    		  done(client);
		    		}
		    		console.log(err);
		   			reply('error occurred');
		    		return true;
		  		};

		    	// handle an error from the connection
		    	if(handleError(err)) {
		    		return;
		    	}

		      	// get all of the tasks in the table
		      	client.query('SELECT * FROM leaderboard ORDER BY points DESC;', function(err, result) {

		        	// handle an error from the query
		        	if(handleError(err)) return;

		        	// return the client to the connection pool for other requests to reuse
		        	response.rows = result.rows;
		        	console.log(response);
		        	reply(response);
		    	});
			});
    		//reply(tableModel);
    	}
    })

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log('Server running at:', server.info.uri);
    });
});