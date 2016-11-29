var Promise = require('bluebird');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');
var DbConnection = require('./dbInstance.js');

var dbInstance;

// Constructor
function Version(payload) {
  this.methodologyModelDelta = payload.methodologyModelVersion;
  this.id = payload.methodologyModelVersionId;
  this.methodologyModel = payload.methodologyModel;
  this.methodologyModelId = payload.methodologyModelId;
  dbInstance = new DbConnection(payload.connectionConfiguration);
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

      dbInstance.performGet('gps.methodology_model_version?id=' + this.id + '&loadDeltaData=true')
        .then(function(serverResponse) {
          var methodologyModelDelta = serverResponse.data;
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
      dbInstance.performGet('gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true')
        .then(function(serverResponse) {
          var methodologyModel = serverResponse.data;
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

Version.prototype.getElementsForAddDeltaProcess = function() {
  var addDelta = this.methodologyModelDelta.add;
};

var myVersion = new Version({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
  connectionConfiguration: {
    domainProtocol: 'http://',
    host: 'localhost',
    port: '9000',
    headers: {
      'X-BAASBOX-APPCODE': '1234567890',
      'Authorization': 'Basic YWRtaW46YWRtaW4=',
    },
  },
});

myVersion.prepareMethodologyModelVersionBuilder()
  .then(function() {
    var methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
    methodologyModelDeltaBuilderController
        .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta);
  })
  .catch(function(error) {
    console.log(error);
  });
