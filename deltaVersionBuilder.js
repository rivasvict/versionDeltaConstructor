var axios = require('axios');
var Promise = require('bluebird');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');

var dbInstance = axios.create({
  baseURL: 'http://localhost:9000/plugin/',
  headers: {
    'X-BAASBOX-APPCODE': '1234567890',
    'Authorization': 'Basic YWRtaW46YWRtaW4=',
  },
});

// Constructor
function Version(payload) {
  this.methodologyModelDelta = payload.methodologyModelVersion;
  this.id = payload.methodologyModelVersionId;
  this.methodologyModel = payload.methodologyModel;
  this.methodologyModelId = payload.methodologyModelId;
};

Version.prototype.prepareMethodologyModelVersionBuilder = function() {
  return new Promise(function(resolve, reject) {
    Promise.all([this.setMethodologyModelDelta(), this.setMethodologyModel(),])
      .then(function() {
        resolve();
      })
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

Version.prototype.setMethodologyModelDelta = function() {
  return new Promise(function(fulfill, reject) {
    if (this.id && !this.methodologyModelDelta) {

      dbInstance.get('gps.methodology_model_version?id=' + this.id + '&loadDeltaData=true', {
        data: {},
      })
        .then(function(serverResponse) {
          var methodologyModelDelta = serverResponse.data.data;
          this.methodologyModelDelta = methodologyModelDelta;
          fulfill(this.methodologyModelDelta);
        }.bind(this))
        .catch(function(error) {
          reject(error);
        });
      return;
    }
    fulfill(this.methodologyModelDelta);
  }.bind(this));
};

Version.prototype.setMethodologyModel = function() {
  return new Promise(function(fulfill, reject) {
    if (this.methodologyModelId && !this.methodologyModel) {
      dbInstance.get('gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true', {
        data: {},
      })
        .then(function(serverResponse) {
          var methodologyModel = serverResponse.data.data;
          this.methodologyModel = methodologyModel.disciplines;
          fulfill(methodologyModel.disciplines);
        }.bind(this))
        .catch(function(error) {
          console.log(error);
          reject();
        });
      return;
    }
    fulfill(this.methodologyModel);
  }.bind(this));
};

Version.prototype.loadMethodologyModelDeltaVersionFromId = function(methodologyModelVersionId) {
  methodologyModelVersionId = methodologyModelVersionId || this.id;
  return new Promise(function(fulfill, reject) {
    dbInstance.get('gps.methodology_model_version?id=' + methodologyModelVersionId + '&loadDeltaData=true', {
      data: {},
    })
      .then(function(serverResponse) {
        var methodologyModelDeltaVersion = serverResponse.data.data;
        //console.log(this);
        fulfill(methodologyModelDeltaVersion);
      }.bind(this))
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

Version.prototype.getElementsForAddDeltaProcess = function() {
  var addDelta = this.methodologyModelDelta.add;
};

var myVersion = new Version({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
});

//setTimeout(function() {console.log(myVersion)}, 3000);

/*var http = require('http');

const PORT = 8080;

function handleRequest(request, response) {
  myVersion.prepareMethodologyModelVersionBuilder()
    .then(function() {
      //console.log(myVersion.methodologyModelDelta.add.disciplines);
      var methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
      response.end(JSON.stringify(methodologyModelDeltaBuilderController
          .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta)));
    })
    .catch(function(error) {
      console.log(error);
    });

};

var server = http.createServer(handleRequest);

server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});*/
myVersion.prepareMethodologyModelVersionBuilder()
  .then(function() {
    //console.log(myVersion.methodologyModelDelta.add.disciplines);
    var methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
    console.log(methodologyModelDeltaBuilderController
        .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta));
  })
  .catch(function(error) {
    console.log(error);
  });
