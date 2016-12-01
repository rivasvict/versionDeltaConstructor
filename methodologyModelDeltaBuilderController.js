var _;

function MethodologyModelDeltaBuilderController(payload) {
  _ = payload.alreadyResolvedDependencies.underscore || require('underscore');
};

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
