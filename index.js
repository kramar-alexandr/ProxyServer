var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

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

server.start(router.route, handle);
