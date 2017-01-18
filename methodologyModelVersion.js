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
    return [this.fetchAllDataComingFromServer(),];
  } else if (this.questionnaire && this.id) {
    return [this.fetchMethodologyModelDelta(),];
  }
};

MethodologyModelVersion.prototype.fetchAllDataComingFromServer = function() {
  return new Promise(function(fulfill, reject) {
    if (this.id && !this.methodologyModelDelta && !this.questionnaire) {
      dbInstance
        .performGet('gps.methodology_model_version?id=' + this.id + '&loadAllDataForQuestionnaireVersioning=true')
        .then(function(serverResponse) {
          this.setAllDataComingFromServerResponse(serverResponse);
          fulfill({
            methodologyModelDelta: this.methodologyModelDelta,
            questionnaire: this.questionnaire,
            versionDeltaModel: this.versionDeltaModel,
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

MethodologyModelVersion.prototype.setAllDataComingFromServerResponse = function(serverResponse) {
  this.methodologyModelDelta = serverResponse.data.methodologyModelVersionDelta;
  this.questionnaire = serverResponse.data.methodologyModelWithQuestionnaire.disciplines;
  this.versionDeltaModel = serverResponse.data.versionDeltaModel;
},

MethodologyModelVersion.prototype.fetchMethodologyModelDelta = function() {
  return new Promise(function(fulfill, reject) {
    if (this.id && !this.methodologyModelDelta) {
      dbInstance.performGet('gps.methodology_model_version?id=' + this.id + '&loadDeltaData=true')
        .then(function(serverResponse) {
          this.setMethodologyModelDeltaFromServerResponse(serverResponse);
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

MethodologyModelVersion.prototype.setMethodologyModelDeltaFromServerResponse = function(serverResponse) {
  var methodologyModelDelta = serverResponse.data;
  this.methodologyModelDelta = methodologyModelDelta;
};

MethodologyModelVersion.prototype.build = function(options) {
  options = options || {};
  var versionedQuestionnaire;
  return new Promise(function(fulfill, reject) {
    this.prepareMethodologyModelVersionBuilder()
      .then(function(versionModel) {
        this.baseQuestionnaire = this.applyBaseChanges(versionModel);
        versionedQuestionnaire = this.applyVersionChanges(this.baseQuestionnaire,
          versionModel.methodologyModelDelta);

        this.versionedQuestionnaire = versionedQuestionnaire;
        var objectForFulfillment = _.clone(this);
        this.cleanBuild(options);
        fulfill({
          questionnaire: objectForFulfillment.questionnaire,
          versionedQuestionnaire: objectForFulfillment.versionedQuestionnaire,
          methodologyModelDelta: objectForFulfillment.methodologyModelDelta,
          baseQuetionnaire: objectForFulfillment.baseQuestionnaire,
          versionDeltaModel: objectForFulfillment.versionDeltaModel,
        });
      }.bind(this))
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

MethodologyModelVersion.prototype.applyBaseChanges = function(versionModel) {
  var baseQuestionnaireCloned = _.clone(versionModel.questionnaire);
  var baseQuestionnaireForVersion = this.applyVersionChanges(baseQuestionnaireCloned, versionModel.methodologyModelDelta.base || {});

  return baseQuestionnaireForVersion || baseQuestionnaireCloned;
};

MethodologyModelVersion.prototype.applyVersionChanges = function(baseQuestionnaire, deltas) {
  return methodologyModelDeltaBuilderController
    .buildMethodologyModelFromDeltaVersion(baseQuestionnaire, deltas);
};

MethodologyModelVersion.prototype.cleanBuild = function(options) {
  if (!options.keepAllObjectData) {
    this.cleanAll();
  } else {
    if (options.removeOriginalQuestionnaireFromTheObject) {
      delete this.questionnaire;
    }
    if (options.removeVersionedQuestionnaireFromTheObject) {
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
