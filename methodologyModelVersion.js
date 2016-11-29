var Promise = require('bluebird');
var DbConnection = require('./dbInstance.js');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');

var dbInstance;
var methodologyModelDeltaBuilderController;

// Constructor
function Version(payload) {
  this.methodologyModelDelta = payload.methodologyModelVersion;
  this.id = payload.methodologyModelVersionId;
  this.methodologyModel = payload.methodologyModel;
  this.methodologyModelId = payload.methodologyModelId;
  this.questionnaireWasSentOnConstruction = this.methodologyModel ? true : false;
  dbInstance = new DbConnection({
    connectionConfiguration: payload.connectionConfiguration,
    alreadyResolvedDependencies: {
      bluebird: Promise,
    },
  });
  methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
};

Version.prototype.prepareMethodologyModelVersionBuilder = function() {
  return new Promise(function(resolve, reject) {
    Promise.all([this.setMethodologyModelDelta(), this.setMethodologyModel(),])
      .then(function() {
        resolve(this);
      }.bind(this))
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
          reject(error);
        });
      return;
    }
    fulfill(this.methodologyModel);
  }.bind(this));
};

Version.prototype.getElementsForAddDeltaProcess = function() {
  var addDelta = this.methodologyModelDelta.add;
};

Version.prototype.build = function(options) {
  options = options || {};
  return new Promise(function(fulfill, reject) {
    this.prepareMethodologyModelVersionBuilder()
      .then(function(versionModel) {
        var versionedQuestionnaire = methodologyModelDeltaBuilderController
          .buildMethodologyModelFromDeltaVersion(versionModel.methodologyModel, versionModel.methodologyModelDelta);
        this.versionedQuestionnaire = versionedQuestionnaire;
        this.cleanBuild(options);
        fulfill(versionedQuestionnaire);
      }.bind(this))
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

Version.prototype.cleanBuild = function(options) {
  if ((!options.keepOroginalQuestionnaire && this.questionnaireWasSentOnConstruction) ||
      options.removeOriginalQuestionnaire) {
    delete this.methodologyModel;
  }
};

module.exports = Version;
