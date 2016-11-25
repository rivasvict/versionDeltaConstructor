var _ = require('lodash');

function MethodologyModelDeltaBuilderController() {};

MethodologyModelDeltaBuilderController.prototype.buildMethodologyModelFromDeltaVersion = function(methodologyModel, delta) {
  this.methodologyModel = methodologyModel;
  this.disciplines = this.methodologyModel.disciplines;
  this.delta = delta;
  this.removeElementsThatWereRemoved();
  this.addElementsThatWereAdded();

  return this.methodologyModel;
};

MethodologyModelDeltaBuilderController.prototype.removeElementsThatWereRemoved = function() {
  this.removeQuestions();
  this.removePractices();
  this.removeDisciplines();
};

MethodologyModelDeltaBuilderController.prototype.removeQuestions = function() {
  _.each(this.delta.remove.questions, function(questionId) {
    var practices = this.disciplines.practices;
    _.each(practices, function(practice) {
      var questions = practice.questions;
      _.each(questions, function() {
        questions = _.withdout(questions, _.findWhere(questions, { id: questionId, }));
      });
    });
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removePractices = function() {
  _.each(this.delta.remove.practices, function(practiceId) {
    var practices = this.disciplines.practices;
    _.each(practices, function() {
      practices = _.without(practices, _.findWhere(practices, { id: practiceId, }));
    });
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removeDisciplines = function() {
  _.each(this.delta.remove.disciplines, function(disciplineId) {
    this.disciplines = _.without(this.disciplines, _.findWhere(this.disciplines, { id: disciplineId, }));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addElementsThatWereAdded = function() {
  this.addDisciplines();
  this.addPractices();
  this.addQuestions();
};

MethodologyModelDeltaBuilderController.prototype.addDisciplines = function() {
  _.each(this.delta.add.disciplines, function(discplineToAdd) {
    this.methodologyModel.push(discplineToAdd);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addPractices = function() {
  var disciplines = this.methodologyModel.disciplines;
  _.each(this.delta.add.practices, function(practiceToAdd) {
    _.each(practiceToAdd.bb_discipline, function(relationId) {
      var disciplineTarget = _.findWhere(disciplines, { '@rid': relationId, });
      if (disciplineTarget) {
        disciplineTarget.push(practiceToAdd);
      }
    });
  });
};

MethodologyModelDeltaBuilderController.prototype.addQuestions = function() {
  _.each(this.delta.add.questions, function(questionToAdd) {
    _.each(this.methodologyModel.disciplines, function(discipline) {
      var practices = discipline.practices;
      _.each(practices, function(practice) {
        var questions = practice.questions;
        _.each(questions, function(question) {
          _.each(questions.bb_practice, function(relationId) {
            var practiceTarget = _.findWhere(practices, { '@rid': relationId });
            if (practiceTarget) {
              practiceTarget.push(questionToAdd);
            }
          });
        });
      });
    })
  });
};

module.exports = MethodologyModelDeltaBuilderController;
