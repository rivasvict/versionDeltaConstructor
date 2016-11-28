// Consider that methodologyModelVersionBackbone and methodologyModelBacbone have nothing to do with backbone framework
// but the part of the body called backbone
var _ = require('lodash');
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
    Promise.all([this.prepareMethodologyModelVersion(), this.prepareMethodologyModel(),])
      .then(function() {
        resolve();
      })
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

Version.prototype.prepareMethodologyModelVersion = function() {
  return new Promise(function(resolve, reject) {
    if (this.id && !this.methodologyModelDelta) {
      this.setMethodologyModelDelta()
        .then(function() {
          resolve();
        }.bind(this))
        .catch(function() {
          reject(error);
        });
    }
  }.bind(this));
};

Version.prototype.prepareMethodologyModel = function() {
  return new Promise(function(resolve, reject) {
    if (this.methodologyModelId && !this.methodologyModel) {
      this.setMethodologyModel()
        .then(function(methodologyModel) {
          this.methodologyModel = methodologyModel;
          resolve(this.methodologyModel);
        }.bind(this))
        .catch(function(error) {
          reject(error);
        });
    }
  }.bind(this));
};

Version.prototype.setMethodologyModelDelta = function() {
  return new Promise(function(fulfill, reject) {
    this.loadMethodologyModelVersionBackboneFromId()
      .then(function(methodologyModelDelta) {
        this.methodologyModelDelta = methodologyModelDelta;
        fulfill();
      }.bind(this))
      .catch(function(error) {
        console.log(error);
        reject();
      });
  }.bind(this));
};

Version.prototype.setMethodologyModel = function() {
  return new Promise(function(fulfill, reject) {
    dbInstance.get('gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true', {
      data: {},
    })
      .then(function(serverResponse) {
        var methodologyModel = serverResponse.data.data;
        fulfill(methodologyModel.disciplines);
      })
      .catch(function(error) {
        console.log(error);
        reject();
      });
  }.bind(this));
};

Version.prototype.loadMethodologyModelVersionBackboneFromId = function(methodologyModelVersionId) {
  methodologyModelVersionId = methodologyModelVersionId || this.id;
  return new Promise(function(fulfill, reject) {
    dbInstance.get('gps.methodology_model_version?id=' + methodologyModelVersionId + '&loadDeltaData=true', {
      data: {},
    })
      .then(function(serverResponse) {
        var methodologyModelVersionBackbone = serverResponse.data.data;
        fulfill(methodologyModelVersionBackbone);
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
    methodologyModelDeltaBuilderController
        .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta);
  })
  .catch(function(error) {
    console.log(error);
  });

