(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MethodologyModelVersion = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var axios;
var Promise;

function DbInstance(payload) {
  Promise = payload.alreadyResolvedDependencies.bluebird || require('bluebird');
  this.DOMAIN_PROTOCOL = payload.connectionConfiguration.domainProtocol || '',
  this.HOST = payload.connectionConfiguration.host || '';
  this.PORT = payload.connectionConfiguration.port || '',
  this.RESOURCE_DIRECTORY = 'plugin';
  this.BASE_URL = payload.connectionConfiguration.baseUrl ||
    this.DOMAIN_PROTOCOL + this.HOST + ':' + this.PORT + '/' + this.RESOURCE_DIRECTORY + '/';
  this.headers = payload.connectionConfiguration.headers || undefined;
  this.JQUERY_NAME = 'jquery';
  this.AXIOS_NAME = 'axios';
  var isJqueryUnavailable = typeof $ === 'undefined';
  this.typeOfConfiguration = isJqueryUnavailable ? this.AXIOS_NAME : this.JQUERY_NAME;
  if (isJqueryUnavailable) {
    axios = require('axios');
    this.axiosConnection = this.getAxiosConnection();
  }
};

DbInstance.prototype.getAxiosConnection = function() {
  return axios.create({
    baseUrl: this.BASE_URL,
    headers: this.headers,
  });
};

DbInstance.prototype.performGet = function(url) {
  var getFunction = this.getFunctionReferenceToCall()[this.typeOfConfiguration].get;
  return getFunction.call(this, url);
};

DbInstance.prototype.getFunctionReferenceToCall = function() {
  return {
    axios: {
      get: this.axiosGet,
    },
    jquery: {
      get: this.jqueryGet,
    },
  };
},

DbInstance.prototype.axiosGet = function(url) {
  return new Promise(function(fulfill, reject) {
    this.axiosConnection.get(this.BASE_URL + url, {
      data: {},
    })
    .then(function(serverResponse) {
      fulfill(serverResponse.data);
    })
    .catch(function(error) {
      reject(error.stack);
    });
  }.bind(this));
},

DbInstance.prototype.jqueryGet = function(url) {
  return new Promise(function(fulfill, reject) {
    $.ajax({
      type: 'get',
      url: this.BASE_URL + url,
      success: function(serverResponse) {
        fulfill(serverResponse);
      },
      error: function(error) {
        reject(error.stack);
      },
    });
  }.bind(this));
},

module.exports = DbInstance;

},{"axios":"axios","bluebird":"bluebird"}],2:[function(require,module,exports){
var MethodologyModelVersion = require('./methodologyModelVersion');

module.exports = MethodologyModelVersion;

},{"./methodologyModelVersion":4}],3:[function(require,module,exports){
var _;

function MethodologyModelDeltaBuilderController(payload) {
  _ = payload.alreadyResolvedDependencies.underscore || require('underscore');
};

MethodologyModelDeltaBuilderController.prototype.buildMethodologyModelFromDeltaVersion = function(questionnaire, delta) {
  this.questionnaire = this.copyQuestionnaire(questionnaire);
  this.delta = delta;
  this.delta.remove = this.delta.remove || {};
  this.delta.add = this.delta.add || {};
  this.removeElementsThatWereRemoved();
  this.addElementsThatWereAdded();

  return this.questionnaire;
};

MethodologyModelDeltaBuilderController.prototype.copyQuestionnaire = function(questionnaire) {
  return _.map(questionnaire, function(discipline) {
    discipline.practices = _.map(discipline.practices, function(practice) {
      practice.questions = _.map(practice.questions, function(question) {
        return _.clone(question);
      });
      return _.clone(practice);
    });
    return _.clone(discipline);
  });
};

MethodologyModelDeltaBuilderController.prototype.removeElementsThatWereRemoved = function() {
  this.removeQuestions();
  this.removePractices();
  this.removeDisciplines();
};

MethodologyModelDeltaBuilderController.prototype.removeQuestions = function() {
  _.each(this.delta.remove.questions, function(questionId) {
    _.find(this.questionnaire, function(discipline) {
      _.find(discipline.practices, function(practice) {
        var foundQuestion = _.findWhere(practice.questions, { id: questionId, });
        practice.questions = _.without(practice.questions, foundQuestion);
        return foundQuestion;
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removePractices = function() {
  _.each(this.delta.remove.practices, function(practiceId) {
    _.find(this.questionnaire, function(discipline) {
      var foundPractice = this.maintainRelationshipsInNewComponents({
        parentComponentName: 'practices',
        componentId: practiceId,
        collectionToFind: discipline.practices,
        childComponentName: 'questions',
      });
      discipline.practices = _.without(discipline.practices, foundPractice);
      return foundPractice;
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.maintainRelationshipsInNewComponents = function(options) {
  var updateMetadata = _.find(this.delta.update[options.parentComponentName], function(updateInfo) {
    return updateInfo.old === options.componentId;
  });

  var newComponent = _.find(this.delta.add[options.parentComponentName], function(practice) {
    return practice.id === (updateMetadata && updateMetadata.new);
  });

  var oldComponent = _.find(options.collectionToFind, function(model) {
    return model.id === options.componentId;
  });

  if (newComponent)
  newComponent[options.childComponentName] = oldComponent && oldComponent[options.childComponentName];

  return oldComponent;
};

MethodologyModelDeltaBuilderController.prototype.removeDisciplines = function() {
  _.each(this.delta.remove.disciplines, function(disciplineId) {
    this.maintainRelationshipsInNewComponents({
      parentComponentName: 'disciplines',
      componentId: disciplineId,
      collectionToFind: this.questionnaire,
      childComponentName: 'practices',
    });
    this.questionnaire = _.without(this.questionnaire, _.findWhere(this.questionnaire, { id: disciplineId, }));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addElementsThatWereAdded = function() {
  this.addDisciplines();
  this.addPractices();
  this.addQuestions();
};

MethodologyModelDeltaBuilderController.prototype.addDisciplines = function() {
  _.each(this.delta.add.disciplines, function(disciplineToAdd) {
    disciplineToAdd.practices = disciplineToAdd.practices || [];
    this.questionnaire.push(disciplineToAdd);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addPractices = function() {
  _.each(this.delta.add.practices, function(practiceToAdd) {
    _.find(practiceToAdd.bb_discipline, function(disciplineRelationShip) {
      var siblingPractices = _.findWhere(this.questionnaire, { '@rid': disciplineRelationShip, });
      if (siblingPractices && siblingPractices.practices) {
        practiceToAdd.questions = practiceToAdd.questions || [];
        siblingPractices.practices.push(practiceToAdd);
        return siblingPractices.practices;
      }
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addQuestions = function() {
  this.linearizePractices();
  _.each(this.delta.add.questions, function(questionToAdd) {
    _.find(questionToAdd.bb_practice, function(practiceRelationShip) {
      var possiblePracticeParent = _.findWhere(this.linearizedPractices, { '@rid': practiceRelationShip, });
      if (possiblePracticeParent) {
        var siblingQuestions = possiblePracticeParent.questions || [];
        siblingQuestions.push(questionToAdd);
        possiblePracticeParent.questions = siblingQuestions;
        return siblingQuestions;
      }
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.linearizePractices = function() {
  this.linearizedPractices = [];
  _.each(this.questionnaire, function(discipline) {
    this.linearizedPractices.push(discipline.practices);
  }.bind(this));
  this.linearizedPractices = _.flatten(this.linearizedPractices);
};

module.exports = MethodologyModelDeltaBuilderController;

},{"underscore":"underscore"}],4:[function(require,module,exports){
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

},{"./dbInstance.js":1,"./methodologyModelDeltaBuilderController":3,"bluebird":"bluebird","underscore":"underscore"}]},{},[2])(2)
});