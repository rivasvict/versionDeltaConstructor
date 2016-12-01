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
    this.axiosConnection = this.typeOfConfiguration === this.AXIOS_NAME ? this.getAxiosConnection() : undefined;
  }
};

DbInstance.prototype.getAxiosConnection = function() {
  return axios.create({
    baseUrl: this.BASE_URL,
    headers: this.headers,
  });
};

DbInstance.prototype.performGet = function(url) {
  var getFuncrion = this.getFunctionReferenceToCall()[this.typeOfConfiguration].get;
  return getFuncrion.call(this, url);
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
var _ = typeof window !== 'undefined' && typeof window._ !== 'undefined' ? window._ : require('underscore');

function MethodologyModelDeltaBuilderController() {};

MethodologyModelDeltaBuilderController.prototype.buildMethodologyModelFromDeltaVersion = function(questionnaire, delta) {
  this.questionnaire = questionnaire;
  this.delta = delta;
  this.removeElementsThatWereRemoved();
  this.addElementsThatWereAdded();

  return this.questionnaire;
};

MethodologyModelDeltaBuilderController.prototype.initializeEmptyArraysForPracticesInDisciplines = function() {
  _.each(this.questionnaire, function(discipline) {
    discipline.practices = discipline.practices || [];
  });
};

MethodologyModelDeltaBuilderController.prototype.initializeEmptyArraysForQuestionsInPractices = function() {
  _.each(this.linearizedPractices, function(practice) {
    practice.questions = practice.questions || [];
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
      var foundPractice = _.findWhere(discipline.practices, { id: practiceId, });
      discipline.practices = _.without(discipline.practices, foundPractice);
      return foundPractice;
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removeDisciplines = function() {
  _.each(this.delta.remove.disciplines, function(disciplineId) {
    this.questionnaire = _.without(this.questionnaire, _.findWhere(this.questionnaire, { id: disciplineId, }));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addElementsThatWereAdded = function() {
  this.addDisciplines();
  this.addPractices();
  this.addQuestions();
};

MethodologyModelDeltaBuilderController.prototype.addDisciplines = function() {
  _.each(this.delta.add.disciplines, function(discplineToAdd) {
    discplineToAdd.practices = discplineToAdd.practices || [];
    this.questionnaire.push(discplineToAdd);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addPractices = function() {
  _.each(this.delta.add.practices, function(practiceToAdd) {
    _.find(practiceToAdd.bb_discipline, function(disciplineRelationShip) {
      var siblingPractices = _.findWhere(this.questionnaire, { '@rid': disciplineRelationShip, }).practices;
      if (siblingPractices) {
        practiceToAdd.questions = practiceToAdd.questions || [];
        siblingPractices.push(practiceToAdd);
        return siblingPractices;
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
        var siblingQuestions = possiblePracticeParent.questions;
        siblingQuestions.push(questionToAdd);
        return siblingQuestions;
      }
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.linearizePractices = function() {
  this.linearizedPractices = [];
  _.each(this.questionnaire, function(discipline) {
    _.extend(this.linearizedPractices, discipline.practices);
  }.bind(this));
};

module.exports = MethodologyModelDeltaBuilderController;

},{"underscore":"underscore"}],4:[function(require,module,exports){
var Promise = typeof window !== 'undefined' && typeof window.Promise !== 'undefined' ? window.Promise : require('bluebird');
var DbConnection = require('./dbInstance.js');
var MethodologyModelDeltaBuilderController = require('./methodologyModelDeltaBuilderController');

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
  methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
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
        fulfill(this);
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

},{"./dbInstance.js":1,"./methodologyModelDeltaBuilderController":3,"bluebird":"bluebird"}]},{},[2])(2)
});