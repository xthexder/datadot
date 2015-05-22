var http = require('http'),
	urlp = require('url'),
	influx = require('influx');

var apiKey, dbUrl, host, port, db;

function handleIntake(url, req, resp) {
	if (checkApiKey(url, req, resp)) return;

	console.log("handleIntake");
	console.log(url);
}

function handleApi(url, req, resp) {
	if (checkApiKey(url, req, resp)) return;

	console.log("handleApi");
	console.log(url);
}

function checkApiKey(url, req, resp) {
	if (req.headers['User-Agent'] == "Datadog-Status-Check") {
		resp.writeHead(200, {"Content-Type": "text/plain"});
		resp.end("STILL-ALIVE\n");
		return true
	}

	if (url.query['api_key'] === apiKey) {
		return false
	}

	console.log("Got bad API key: " + url.query['api_key']);
	resp.writeHead(403, {"Content-Type": "text/plain"});
	resp.end("Bad API Key\n");
	return true
}

var server = http.createServer(function (req, resp) {
	try {
		var url = urlp.parse(req.url, true);
		if (url.pathname == "/intake") {
			return handleIntake(url, req, resp);
		} else if (url.pathname.indexOf("/api/v1/series/") === 0) {
			return handleApi(url, req, resp);
		}
		console.log("404");
		console.log(url);
		resp.writeHead(404, {"Content-Type": "text/plain"});
		resp.end("404 Not Found\n");
	} catch (e) {
		console.log(e);
	}
});

apiKey = process.env.API_KEY;
dbUrl = urlp.parse(process.env.DB_URL || "http://localhost:8086/db/datadog?u=root&p=root", true);
host = process.env.HOST || "0.0.0.0";
port = process.env.PORT || 4065;

if (typeof apiKey !== "string" || apiKey.length <= 0) throw "API_KEY missing";

db = influx({
  host : dbUrl.hostname,
  port : dbUrl.port,
  protocol : dbUrl.protocol.substring(0, dbUrl.protocol.length-1),
  username : dbUrl.query.u,
  password : dbUrl.query.p,
  database : dbUrl.pathname.substring(4)
})

server.listen(port, host, function() {
	console.log("Server running at http://" + host + ":" + port + "/");
});
