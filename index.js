var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var backups = require("./backups");
var sendmail = require("./sendmail");

var handle = {};
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/getProxyRequest"] = requestHandlers.getProxyRequest;
handle["/sendMail"] = sendmail.sendMail;
handle["/getCurTime"] = requestHandlers.getCurTime;
handle["/index"] = requestHandlers.index;
handle["/getPosImage"] = requestHandlers.getPosImage;
handle["/setUserImage"] = requestHandlers.setUserImage;
handle["/setUserImageUsingAbsPath"] = requestHandlers.setUserImageUsingAbsPath;
handle["/copyFileToFTP"] = backups.copyFileToFTP;

server.start(router.route, handle);
