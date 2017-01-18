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
