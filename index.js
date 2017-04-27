var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var backups = require("./backups");

var handle = {};
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/getProxyRequest"] = requestHandlers.getProxyRequest;
handle["/sendMail"] = requestHandlers.sendMail;
handle["/getCurTime"] = requestHandlers.getCurTime;
handle["/index"] = requestHandlers.index;
handle["/getPosImage"] = requestHandlers.getPosImage;
handle["/setUserImage"] = requestHandlers.setUserImage;

handle["/copyFileToFTP"] = backups.copyFileToFTP;

server.start(router.route, handle);