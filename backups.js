var logtext = require('./logtext');
var SMTPConnection = require('smtp-connection');
var nodemailer = require('nodemailer');
const url = require('url');
var querystring = require("querystring");
var fs = require("fs");
var fsnew = require("fs");
var formidable = require("formidable");
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
var ftpClient = require('ftp');
//const sftp = require('whoosh');
//var scp = require('scp');
var client = require('scp2');


function copyFileToFTP(response,request){
    //INput json
    //  folder - folder to file
    //  filename - filename to archive
    //  protocol - FTP or SFTP
    //  host
    //  port
    //  user
    //  passwd
    //  backuppath - path for file in backup side
    //

  /*
{
"folder":"",
"filename":"",
"protocol":"",
"host":"",
"port":"",
"user":"",
"passwd":"",
"backuppath":""
}


  */


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
            if(dataobj.folder[dataobj.folder.length-1]!='/'){
              dataobj.folder = dataobj.folder + '/';
            }
            logtext.log(dataobj.folder[dataobj.folder.length-1]);
            if(dataobj.folder + dataobj.filename){
                let filenotfound = false;
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
                                if(dataobj.protocol=="FTP"){
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
                                }
                                if(dataobj.protocol=="SFTP"){
                                    client.scp(dataobj.folder + dataobj.filename + '.gz', {
                                        host: dataobj.host,
                                        port:dataobj.port,
                                        username: dataobj.user,
                                        password: dataobj.passwd,
                                        path: dataobj.backuppath
                                    }, function(err) {
                                        if(err){
                                            logtext.log(err);
                                        }else{
                                            logtext.log('UploadComplite');
                                        }
                                    });
                                }
                            } else {
                                logtext.log('GZIP file not found');
                            }
                        });
                    });

                  } else {
                    filenotfound = true;
                    logtext.log('file not found ' + dataobj.folder + dataobj.filename);
                    if(filenotfound){
                      logtext.log('try found file ' + dataobj.folder + dataobj.filename + '.gz');
                      fsnew.exists(dataobj.folder + dataobj.filename + '.gz', (existsnew) => {
                        if (existsnew) {
                          logtext.log('file found ' + dataobj.folder + dataobj.filename + '.gz');
                          if(dataobj.protocol=="FTP"){
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
                          }
                          if(dataobj.protocol=="SFTP"){
                              logtext.log('Prepare to SFTP transfer');
                              try{
                                logtext.log(dataobj.folder + dataobj.filename + '.gz');
                              client.scp(dataobj.folder + dataobj.filename + '.gz', {
                                  host: dataobj.host,
                                  port:dataobj.port,
                                  username: dataobj.user,
                                  password: dataobj.passwd,
                                  path: dataobj.backuppath
                              }, function(err) {
                                  if(err){
                                      logtext.log(err);
                                  }else{
                                      logtext.log('UploadComplite');
                                  }
                              });
                            }catch(e){
                              return logtext.error(e);
                            }
                          }
                        }else {logtext.log('GZIP file not found');}
                      });
                    }
                  }
                });
                if(filenotfound){
                  logtext.log('try found file ' + dataobj.folder + dataobj.filename + '.gz');
                  fsnew.exists(dataobj.folder + dataobj.filename + '.gz', (exists1) => {
                    if (exists1) {
                      logtext.log('file found ' + dataobj.folder + dataobj.filename + '.gz');
                    }
                  });
                }
            }

        } catch (e) {
            return logtext.error(e);
        }

    });

}

exports.copyFileToFTP = copyFileToFTP;
