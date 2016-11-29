var _ = require('underscore');

function MethodologyModelDeltaBuilderController() {};

MethodologyModelDeltaBuilderController.prototype.buildMethodologyModelFromDeltaVersion = function(methodologyModel, delta) {
  this.methodologyModel = methodologyModel;
  this.delta = delta;
  this.removeElementsThatWereRemoved();
  this.addElementsThatWereAdded();

  return this.methodologyModel;
};

MethodologyModelDeltaBuilderController.prototype.initializeEmptyArraysForPracticesInDisciplines = function() {
  _.each(this.methodologyModel, function(discipline) {
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
    _.find(this.methodologyModel, function(discipline) {
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
    _.find(this.methodologyModel, function(discipline) {
      var foundPractice = _.findWhere(discipline.practices, { id: practiceId, });
      discipline.practices = _.without(discipline.practices, foundPractice);
      return foundPractice;
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removeDisciplines = function() {
  _.each(this.delta.remove.disciplines, function(disciplineId) {
    this.methodologyModel = _.without(this.methodologyModel, _.findWhere(this.methodologyModel, { id: disciplineId, }));
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
    this.methodologyModel.push(discplineToAdd);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addPractices = function() {
  _.each(this.delta.add.practices, function(practiceToAdd) {
    _.find(practiceToAdd.bb_discipline, function(disciplineRelationShip) {
      var siblingPractices = _.findWhere(this.methodologyModel, { '@rid': disciplineRelationShip, }).practices;
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
  _.each(this.methodologyModel, function(discipline) {
    _.extend(this.linearizedPractices, discipline.practices);
  }.bind(this));
};

module.exports = MethodologyModelDeltaBuilderController;
