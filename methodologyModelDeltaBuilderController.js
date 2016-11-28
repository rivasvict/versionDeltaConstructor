var _ = require('underscore');

function MethodologyModelDeltaBuilderController() {};

MethodologyModelDeltaBuilderController.prototype.buildMethodologyModelFromDeltaVersion = function(methodologyModel, delta) {
  this.methodologyModel = methodologyModel;
  this.delta = delta;
  this.removeElementsThatWereRemoved();
  this.addElementsThatWereAdded();
  //console.log(_.last(this.methodologyModel).practices);
  //console.log(_.first(_.first(this.methodologyModel).practices).questions);
  console.log(this.methodologyModel);

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
    _.each(this.methodologyModel, function(discipline) {
      _.each(discipline.practices, function(practice) {
        practice.questions = _.without(practice.questions, _.findWhere(practice.questions, { id: questionId, }));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removePractices = function() {
  _.each(this.delta.remove.practices, function(practiceId) {
    _.each(this.methodologyModel, function(discipline) {
      discipline.practices = _.without(discipline.practices, _.findWhere(discipline.practices, { id: practiceId, }));
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.removeDisciplines = function() {
  _.each(this.delta.remove.disciplines, function(disciplineId) {
    this.methodologyModel = _.without(this.methodologyModel, _.findWhere(this.methodologyModel, { id: disciplineId, }));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.linearizePractices = function() {
  this.linearizedPractices = [];
  _.each(this.methodologyModel, function(discipline) {
    _.extend(this.linearizedPractices, discipline.practices);/*this.linearizedPractices.push(discipline.practices);*/
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.linearizeQuestions = function() {
  this.linearizedQuestions = [];
  _.each(this.linearizedPractices, function(practice) {
    this.linearizedQuestions.push(practice.questions);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addDisciplines = function() {
  _.each(this.delta.add.disciplines, function(discplineToAdd) {
    discplineToAdd.practices = discplineToAdd.practices || [];
    this.methodologyModel.push(discplineToAdd);
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addPractices = function() {
  _.each(this.delta.add.practices, function(practiceToAdd) {
    _.each(practiceToAdd.bb_discipline, function(disciplineRelationShip) {
      var siblingPractices = _.findWhere(this.methodologyModel, { '@rid': disciplineRelationShip, }).practices;
      practiceToAdd.questions = practiceToAdd.questions || [];
      siblingPractices.push(practiceToAdd);
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addQuestions = function() {
  this.linearizePractices();
  _.each(this.delta.add.questions, function(questionToAdd) {
    _.each(questionToAdd.bb_practice, function(practiceRelationShip) {
      var possiblePracticeParent = _.findWhere(this.linearizedPractices, { '@rid': practiceRelationShip, });
      if (possiblePracticeParent) {
        var siblingQuestions = possiblePracticeParent.questions;
        siblingQuestions.push(questionToAdd);
      }
    }.bind(this));
  }.bind(this));
};

MethodologyModelDeltaBuilderController.prototype.addElementsThatWereAdded = function() {
  this.addDisciplines();
  this.addPractices();
  this.addQuestions();
};






/*MethodologyModelDeltaBuilderController.prototype.removeElementsThatWereRemoved = function() {
  this.removeQuestions();
  this.removePractices();
  this.removeDisciplines();
};

MethodologyModelDeltaBuilderController.prototype.removeQuestions = function() {
  _.each(this.delta.remove.questions, function(questionId) {
    _.without(this.linearizedQuestions, _.findWhere(this.linearizedQuestions, { id: questionId, }));
  }.bind(this));
};*/



/*MethodologyModelDeltaBuilderController.prototype.removeQuestions = function() {
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
};*/

module.exports = MethodologyModelDeltaBuilderController;
