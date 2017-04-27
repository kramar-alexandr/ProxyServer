var logtext = require('./logtext');
var SMTPConnection = require('smtp-connection');
var nodemailer = require('nodemailer');
const url = require('url');
var querystring = require("querystring");
var fs = require("fs");
var formidable = require("formidable");
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
var ftpClient = require('ftp');

function copyFileToFTP(response,request){
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('OK');
    response.end();

    var data = '';
    logtext.log("Request handler 'copyFileToFTP' was called.");

    request.addListener('data', function(chunk) {
      data += chunk;
    });

    request.addListener('end', function() {
        try {
            let dataobj = JSON.parse(data);

            if(dataobj.folder + dataobj.filename){
                fs.exists(dataobj.folder + dataobj.filename, (exists) => {
                  if (exists) {
                    logtext.log('GZIP Start');
                    var zlib = require('zlib');
                    var gzip = zlib.createGzip();
                    var fs = require('fs');
                    var inp = fs.createReadStream(dataobj.folder + dataobj.filename);
                    var out = fs.createWriteStream(dataobj.folder + dataobj.filename + '.gz');
                    inp.pipe(gzip).pipe(out);
                    inp.on('close',function(){
                        logtext.log('GZIP Done');
                        fs.exists(dataobj.folder + dataobj.filename + '.gz', (exists) => {
                            if (exists) {
                                logtext.log('Delete file ' + dataobj.folder + dataobj.filename);
                                fs.unlink(dataobj.folder + dataobj.filename);
                                let c = new ftpClient();
                                let cdata = {
                                    host:  dataobj.host,
                                    port: dataobj.port,
                                    user: dataobj.user,
                                    password: dataobj.passwd
                                };
                                c.connect(cdata);

                                c.on('ready', function() {

                                    c.put(dataobj.folder + dataobj.filename + '.gz',dataobj.backuppath + '/' + dataobj.filename + '.gz',function(){
                                        console.log(dataobj.filename + '.gz');
                                        console.log(dataobj.backuppath + '/' + dataobj.filename + '.gz');
                                        console.log('put');
                                        c.end();
                                    });

                                });
                                c.on('error',function(error){
                                    console.log(error);
                                });



                            } else {
                                logtext.log('GZIP file not found');
                            }
                        });
                    });

                  } else {
                    logtext.log('file not found');
                  }
                });
            }

        } catch (e) {
            return logtext.error(e);
        }

    });

}

exports.copyFileToFTP = copyFileToFTP;
