var Promise = typeof window !== 'undefined' && typeof window.Promise !== 'undefined' ? window.Promise : require('bluebird');
var DbConnection = require('./dbInstance.js');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');

var dbInstance;
var methodologyModelDeltaBuilderController;

// Constructor
function MethodologyModelVersion(payload) {
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

MethodologyModelVersion.prototype.prepareMethodologyModelVersionBuilder = function() {
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

MethodologyModelVersion.prototype.setMethodologyModelDelta = function() {
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

MethodologyModelVersion.prototype.setMethodologyModel = function() {
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

MethodologyModelVersion.prototype.getElementsForAddDeltaProcess = function() {
  var addDelta = this.methodologyModelDelta.add;
};

MethodologyModelVersion.prototype.build = function(options) {
  options = options || {};
  return new Promise(function(fulfill, reject) {
    this.prepareMethodologyModelVersionBuilder()
      .then(function(versionModel) {
        var versionedQuestionnaire = methodologyModelDeltaBuilderController
          .buildMethodologyModelFromDeltaVersion(versionModel.methodologyModel, versionModel.methodologyModelDelta);
        this.versionedQuestionnaire = versionedQuestionnaire;
        fulfill(versionedQuestionnaire);
        this.cleanBuild(options);
      }.bind(this))
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

MethodologyModelVersion.prototype.cleanBuild = function(options) {
  if (!options.keepAllObjectData) {
    this.cleanAll();
  } else {
    if ((!options.keepOroginalQuestionnaireOnTheObject && this.questionnaireWasSentOnConstruction) ||
      options.removeOriginalQuestionnaireFromTheObject) {
      delete this.methodologyModel;
    }
    if (options.removeVersionedQuestionnaireOnTheObject) {
      delete this.versionedQuestionnaire;
    }
    if (options.removeMethodologyModelDeltaOnTheObject) {
      delete this.methodologyModelDelta;
    }
  }
  delete this.questionnaireWasSentOnConstruction;
};

MethodologyModelVersion.prototype.cleanAll = function(options) {
  delete this.methodologyModelDelta;
  delete this.versionedQuestionnaire;
  delete this.methodologyModel;
};

module.exports = MethodologyModelVersion;
