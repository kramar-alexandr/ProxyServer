'use strict'

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
var join = require('path').join;
var path = require('path');
var archiver = require('archiver');

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

function sendBackupFilesThroughSSH()
{
  var backupScenarios = [{
    idName: "FM_Daily",
    pathToBackupFiles: "C:/Program Files/FileMaker/FileMaker Server/Data/Backups/",
    fileNameTemplate: "Daily_",
    maxBackupFilesToServer: 1,
    runSendBackupFilesAtTime: "19:00",
    targetDirectory: "/usr/local/bin/BackupsFromAnotherServer/FileMaker/"
  },
  {
    idName: "FM_Weekly",
    pathToBackupFiles: "C:/Program Files/FileMaker/FileMaker Server/Data/Backups/",
    fileNameTemplate: "Weekly_",
    maxBackupFilesToServer: 0,
    runSendBackupFilesAtTime: "19:00",
    targetDirectory: "/usr/local/bin/BackupsFromAnotherServer/FileMaker/"
  }];
  var backupsInfoHolder = [];
  var prevDoneBackupsList = {};
  var actualDoneBackupsList = {};
  var tempIndex = 0;
  var curScenario = null;

  logtext.log("\n\n\n");
  logtext.log("Start backuping...");

  let idNameList = {};
  let error = false;
  for (var i = 0; i < backupScenarios.length; i++) {
    if (backupScenarios[i].hasOwnProperty('idName') == false) {
      logtext.log("'idName' property undefined");
      error = true;
    }
    if (!error) {
      if (idNameList.hasOwnProperty(backupScenarios[i].idName) == false) {
        idNameList[backupScenarios[i].idName] = true;
      } else {
        logtext.log("ID name '" + backupScenarios[i].idName + "' is not unique!");
        error = true;
      }
    }
    if (error) {
      logtext.log("Backuping process interrupted");
      return;
    }
  }

  if (fs.existsSync(__dirname + "/doneBackupsList.txt")) {
    try {
      prevDoneBackupsList = JSON.parse(fs.readFileSync(__dirname + "/doneBackupsList.txt", 'utf8'));
    } catch (err) {
      logtext.log("JSON parse error: \n" + err);
    }
  }
  //return;

  for (var i = 0; i < backupScenarios.length; i++) {
    curScenario =  backupScenarios[i];
    logtext.log(" Scenario '" + curScenario.idName + "'");

    if (fs.existsSync(curScenario.pathToBackupFiles)) {
      let backupDirItemList = fs.readdirSync(curScenario.pathToBackupFiles
      ).filter(function(index) {
        let fileNameTemp = curScenario.fileNameTemplate;
        return (index.substr(0, fileNameTemp.length) === fileNameTemp);
      }).map(function(index) {
        return join(curScenario.pathToBackupFiles, index);
      }).sort(function (a, b) {
        return a == b? 0: a<b ? 1: -1;
      });
      if (curScenario.maxBackupFilesToServer != undefined &&
          backupDirItemList.length > curScenario.maxBackupFilesToServer) {
        backupDirItemList = backupDirItemList.slice(0,curScenario.maxBackupFilesToServer);
        logtext.log("Number of backups was limited to " + curScenario.maxBackupFilesToServer);
      }

      tempIndex = backupsInfoHolder.length;
      if (backupsInfoHolder[tempIndex] === undefined) {
        backupsInfoHolder[tempIndex] = {};
      }
      backupsInfoHolder[tempIndex].scenario = curScenario;
      backupsInfoHolder[tempIndex].backupDirItemList = backupDirItemList;
      backupsInfoHolder[tempIndex].backupedList = [];

      actualDoneBackupsList[curScenario.idName] = [];
      if (prevDoneBackupsList.hasOwnProperty(curScenario.idName)) {
        actualDoneBackupsList[curScenario.idName] = prevDoneBackupsList[curScenario.idName];
        if (actualDoneBackupsList[curScenario.idName] === undefined) {
          actualDoneBackupsList[curScenario.idName] = [];
        }
      }
    } else {
      logtext.log(curScenario.idName + ". No such directory: " + curScenario.pathToBackupFiles);
    }
  }
  //logtext.log("Current backup scenario '" + backupScenarios[0].idName + "");
  makeArchive(backupsInfoHolder,actualDoneBackupsList,0,0);
}

// Failed to make zip by JSZip and AdmZip, used Archiver
function makeArchive(backupsInfoHolder,actualDoneBackupsList,scIndex,dirItemIndex)
{

  if (scIndex == undefined) {
    scIndex = 0;
  }
  if (dirItemIndex == undefined) {
    dirItemIndex = 0;
  }
  if (scIndex >= backupsInfoHolder.length) {
    makeSSHTrasmit(backupsInfoHolder,actualDoneBackupsList,null,0,0);
    return;
  }

  let curInfoHolder = backupsInfoHolder[scIndex];
  if (dirItemIndex == 0) {
    logtext.log('Current backuping process ' + curInfoHolder.scenario.idName);
  }
  if (dirItemIndex >= curInfoHolder.backupDirItemList.length) {
    makeArchive(backupsInfoHolder,actualDoneBackupsList,scIndex += 1,0);
    return;
  }

  let curBackupItem = curInfoHolder.backupDirItemList[dirItemIndex];
  let outFileName = curBackupItem.slice(curBackupItem.lastIndexOf(path.sep)+1);
  if (outFileName) {
    if (fs.lstatSync(curBackupItem).isFile() && ~outFileName.lastIndexOf(".")) {
      outFileName = outFileName.slice(0,curBackupItem.lastIndexOf("."));
    }
    outFileName = outFileName  + '.zip'
    let zipFileName = path.dirname(curBackupItem) + path.sep + outFileName;

    let prevArchivedList = actualDoneBackupsList[curInfoHolder.scenario.idName];
    var isAlreadyZipped = false;
    for (var i = 0; i < prevArchivedList.length; i++) {
      if (prevArchivedList[i] == outFileName) {
        isAlreadyZipped = true;
        i = prevArchivedList.length;
      }
    }
    if (!isAlreadyZipped) {
      let output = fs.createWriteStream(zipFileName);
      let archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level. Z_BEST_COMPRESSION = 9.
      });

      output.on('close', function() {
        logtext.log(curBackupItem + ' has been archived');
        logtext.log(archive.pointer() + ' total bytes');
        //logtext.log('archiver has been finalized and the output file descriptor has closed.');
        curInfoHolder.backupedList.push(outFileName);
        makeArchive(backupsInfoHolder,actualDoneBackupsList,scIndex,dirItemIndex+=1)
      });

      archive.on('error', function(err) {
        //throw err;
        logtext.log('Archive error: ' + err);
      });

      archive.pipe(output);
      archive.directory(curBackupItem, false);
      archive.finalize();
    }
  }
}

function makeSSHTrasmit(backupsInfoHolder,actualDoneBackupsList,
  SSHConfig,scIndex,backupIndex)
{
  var SSHClient;

  if (scIndex == undefined) {
    scIndex = 0;
  }
  if (backupIndex == undefined) {
    backupIndex = 0;
  }
  if (scIndex >= backupsInfoHolder.length) {
    logtext.log('SSH transmission finished');
    if (SSHClient != undefined) {
      SSHClient.close();
    }
    return;
  }
  if (backupIndex >= backupsInfoHolder[scIndex].backupedList.length) {
    makeSSHTrasmit(backupsInfoHolder,actualDoneBackupsList,SSHConfig,
      scIndex +=1,0);
    return;
  }

  SSHClient = SSHConfig;
  if (SSHClient == undefined) {
    let prKey = fs.readFileSync(__dirname + "/BackupKey", 'utf8');

    SSHClient = new client.Client();
    SSHClient.defaults({
      port: 22,
      host: '144.76.186.251',
      username: 'norn',
      privateKey: prKey
    });
    logtext.log('SSH transmission started');
  }

  let curInfoHolder = backupsInfoHolder[scIndex];
  let archivedFile = curInfoHolder.scenario.pathToBackupFiles + curInfoHolder.backupedList[backupIndex];
  SSHClient.upload(archivedFile,curInfoHolder.scenario.targetDirectory,
    function(err) {
      if(err){
        logtext.log(err);
      }else{
        logtext.log('Uploaded: ' + curInfoHolder.backupedList[backupIndex]);
        fs.unlinkSync(archivedFile);
      }
      //makeSSHTrasmit(backupsInfoHolder,actualDoneBackupsList,SSHConfig,scIndex,backupIndex += 1);
  });

}

function sleep(milliseconds) {
  var start = new Date().getTime();
  while ((new Date().getTime() - start) <= milliseconds){}
}

exports.copyFileToFTP = copyFileToFTP;
exports.sendBackupFilesThroughSSH = sendBackupFilesThroughSSH;
