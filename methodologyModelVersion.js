var Promise = typeof window !== 'undefined' && typeof window.Promise !== 'undefined' ? window.Promise : require('bluebird');
var DbConnection = require('./dbInstance.js');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');
var _ = typeof window !== 'undefined' && typeof window._ !== 'undefined' ? window._ : require('underscore');

var dbInstance;
var methodologyModelDeltaBuilderController;

// Constructor
function MethodologyModelVersion(payload) {
  this.methodologyModelDelta = payload.methodologyModelVersion;
  this.id = payload.methodologyModelVersionId;
  this.questionnaire = payload.questionnaire;
  this.questionnaireWasSentOnConstruction = this.questionnaire ? true : false;
  dbInstance = new DbConnection({
    connectionConfiguration: payload.connectionConfiguration,
    alreadyResolvedDependencies: {
      bluebird: Promise,
    },
  });
  methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController({
    alreadyResolvedDependencies: {
      underscore: _,
    },
  });
};

MethodologyModelVersion.prototype.prepareMethodologyModelVersionBuilder = function() {
  return new Promise(function(resolve, reject) {
    Promise.all(this.getPromiseToLoad())
      .then(function() {
        resolve(this);
      }.bind(this))
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

MethodologyModelVersion.prototype.getPromiseToLoad = function() {
  if (this.id && !this.questionnaire) {
    return [this.setAllDataCommingFromServer(),];
  } else if (this.questionnaire && this.id) {
    return [this.setMethodologyModelDelta(), this.setQuestionnaire(),];
  }
};

MethodologyModelVersion.prototype.setAllDataCommingFromServer = function() {
  return new Promise(function(fulfill, reject) {
    if (this.id && !this.methodologyModelDelta && !this.questionnaire) {
      dbInstance
        .performGet('gps.methodology_model_version?id=' + this.id + '&loadAllDataForQuestionnaireVersioning=true')
        .then(function(serverResponse) {
          var methodologyModelDelta = serverResponse.data.methodologyModelVersionDelta;
          this.methodologyModelDelta = methodologyModelDelta;
          var methodologyModelQuestionnaire = serverResponse.data.methodologyModelWithQestionnaire;
          this.questionnaire = methodologyModelQuestionnaire.disciplines;
          fulfill({
            methodologyModelDelta: this.methodologyModelDelta,
            questionnaire: this.questionnaire,
          });
        }.bind(this))
        .catch(function(error) {
          reject(error);
        });
      return;
    }
    fulfill({
      methodologyModelDelta: this.methodologyModelDelta,
      questionnaire: this.questionnaire,
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

MethodologyModelVersion.prototype.setQuestionnaire = function() {
  return new Promise(function(fulfill, reject) {
    if (this.methodologyModelId && !this.questionnaire) {
      dbInstance.performGet('gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true')
        .then(function(serverResponse) {
          var methodologyModel = serverResponse.data;
          this.questionnaire = methodologyModel.disciplines;
          fulfill(this.questionnaire);
        }.bind(this))
        .catch(function(error) {
          console.log(error);
          reject(error);
        });
      return;
    }
    fulfill(this.questionnaire);
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
          .buildMethodologyModelFromDeltaVersion(versionModel.questionnaire, versionModel.methodologyModelDelta);
        this.versionedQuestionnaire = versionedQuestionnaire;
        var objectForFulfillment = _.clone(this);
        this.cleanBuild(options);
        fulfill({
          questionnaire: objectForFulfillment.questionnaire,
          versionedQuestionnaire: objectForFulfillment.versionedQuestionnaire,
          methodologyModelDelta: objectForFulfillment.methodologyModelDelta,
        });
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
    if (options.removeOriginalQuestionnaireFromTheObject) {
      delete this.questionnaire;
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

MethodologyModelVersion.prototype.cleanAll = function() {
  delete this.methodologyModelDelta;
  delete this.versionedQuestionnaire;
  delete this.questionnaire;
};

module.exports = MethodologyModelVersion;
