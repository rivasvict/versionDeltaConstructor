// Consider that methodologyModelVersionBackbone and methodologyModelBacbone have nothing to do with backbone framework
// but the part of the body called backbone
(function() {
  var _ = require('lodash');
  var axios = require('axios');
  var Promise = require('bluebird');

  var dbInstance = axios.create({
    baseURL: 'http://localhost:9000/plugin/',
    headers: {
      'X-BAASBOX-APPCODE': '1234567890',
      'Authorization': 'Basic YWRtaW46YWRtaW4=',
    },
  });

  // Constructor
  var Version = function(payload) {
    this.methodologyModelDelta = payload.methodologyModelVersion;
    this.id = payload.methodologyModelVersionId;
    this.methodologyModel = payload.methodologyModel;
    this.methodologyModelId = payload.methodologyModelId;
  };

  Version.prototype.prepareMethodologyModelVersionBuilder = function() {
    this.prepareMethodologyModelVersion();
    this.prepareMethodologyModel();
  };

  Version.prototype.prepareMethodologyModelVersion = function() {
    if (this.id && !this.methodologyModelDelta) {
      this.setMethodologyModelDelta();
    }
  };

  Version.prototype.prepareMethodologyModel = function() {
    if (this.methodologyModelId && !this.methodologyModel) {
      this.setMethodologyModel()
        .then(function(methodologyModel) {
          this.methodologyModel = methodologyModel;
        }.bind(this))
        .catch(function(error) {
          console.log(error);
        });
    }
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
      dbInstance.get('gps.discipline?methodologyModelId=' + this.methodologyModelId + '&questionnaireLoad=true', {
        data: {},
      })
        .then(function(serverResponse) {
          var methodologyModel = serverResponse.data.data;
          fulfill(methodologyModel.disciplines);
        })
        .catch(function(error) {
          console.log(error);
          reject();
        });
    }.bind(this));
  };

  Version.prototype.loadMethodologyModelVersionBackboneFromId = function(methodologyModelVersionId) {
    methodologyModelVersionId = methodologyModelVersionId || this.id;
    return new Promise(function(fulfill, reject) {
      dbInstance.get('gps.methodology_model_version?id=' + methodologyModelVersionId, {
        data: {},
      })
        .then(function(serverResponse) {
          var methodologyModelVersionBackbone = serverResponse.data.data;
          fulfill(methodologyModelVersionBackbone);
        }.bind(this))
        .catch(function(error) {
          reject(error);
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

  myVersion.prepareMethodologyModelVersionBuilder();
    /*.then(function() {
    })
    .catch(function(error) {
      console.log(error);
    });*/

  setTimeout(function() {console.log(myVersion)}, 3000);

})();
