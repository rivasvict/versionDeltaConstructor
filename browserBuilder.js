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

function Version(payload) {
  this.methodologyModelDelta = payload.methodologyModelVersion;
  this.id = payload.methodologyModelVersionId;
  this.methodologyModel = payload.methodologyModel;
  this.methodologyModelId = payload.methodologyModelId;
};

Version.prototype.prepareMethodologyModelVersionBuilder = function() {
  return new Promise(function(resolve, reject) {
    Promise.all([this.prepareMethodologyModelVersion(), this.prepareMethodologyModel(),])
      .then(function() {
        resolve();
      })
      .catch(function(error) {
        reject(error);
      });
  }.bind(this));
};

Version.prototype.prepareMethodologyModelVersion = function() {
  return new Promise(function(resolve, reject) {
    if (this.id && !this.methodologyModelDelta) {
      this.setMethodologyModelDelta()
        .then(function() {
          resolve();
        }.bind(this))
        .catch(function(error) {
          reject(error);
        });
      return;
    }
    resolve();
  }.bind(this));
};

Version.prototype.prepareMethodologyModel = function() {
  return new Promise(function(resolve, reject) {
    if (this.methodologyModelId && !this.methodologyModel) {
      this.setMethodologyModel()
        .then(function(methodologyModel) {
          this.methodologyModel = methodologyModel;
          resolve(this.methodologyModel);
        }.bind(this))
        .catch(function(error) {
          reject(error);
        });
      return;
    }
    resolve();
  }.bind(this));
};

Version.prototype.setMethodologyModelDelta = function() {
  return new Promise(function(fulfill, reject) {
    this.loadMethodologyModelVersionBackboneFromId()
      .then(function(methodologyModelDelta) {
        this.methodologyModelDelta = methodologyModelDelta;
        fulfill();
      }.bind(this))
      .catch(function(error) {
        console.log(error);
        reject();
      });
  }.bind(this));
};

Version.prototype.setMethodologyModel = function() {
  return new Promise(function(fulfill, reject) {
  	$.ajax({
  		type: 'get',
  		url: PLUGIN_API_URL + 'gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true',
  		success: function(serverResponse) {
        var methodologyModel = serverResponse.data;
        fulfill(methodologyModel.disciplines);
  		},
  		error: function(error) {
        console.log(error);
        reject();
  		}
  	});
  }.bind(this));
};

Version.prototype.loadMethodologyModelVersionBackboneFromId = function(methodologyModelVersionId) {
  methodologyModelVersionId = methodologyModelVersionId || this.id;
  return new Promise(function(fulfill, reject) {
    $.ajax({
  		type: 'get',
  		url: PLUGIN_API_URL + 'gps.methodology_model_version?id=' + methodologyModelVersionId + '&loadDeltaData=true',
  		success: function(serverResponse) {
        var methodologyModelVersionBackbone = serverResponse.data;
        fulfill(methodologyModelVersionBackbone);
  		},
  		error: function(error) {
        console.log(error);
        reject();
  		}
  	});
  }.bind(this));
};

Version.prototype.getElementsForAddDeltaProcess = function() {
  var addDelta = this.methodologyModelDelta.add;
};

var myVersion = new Version({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
});

//setTimeout(function() {console.log(myVersion)}, 3000);

/*var http = require('http');

const PORT = 8080;

function handleRequest(request, response) {
  myVersion.prepareMethodologyModelVersionBuilder()
    .then(function() {
      //console.log(myVersion.methodologyModelDelta.add.disciplines);
      var methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
      response.end(JSON.stringify(methodologyModelDeltaBuilderController
          .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta)));
    })
    .catch(function(error) {
      console.log(error);
    });

};

var server = http.createServer(handleRequest);

server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});*/
/*myVersion.prepareMethodologyModelVersionBuilder()
  .then(function() {
    //console.log(myVersion.methodologyModelDelta.add.disciplines);
    var methodologyModelDeltaBuilderController = new MethodologyModelDeltaBuilderController();
    methodologyModelDeltaBuilderController
        .buildMethodologyModelFromDeltaVersion(myVersion.methodologyModel, myVersion.methodologyModelDelta);
  })
  .catch(function(error) {
    console.log(error);
  });*/

