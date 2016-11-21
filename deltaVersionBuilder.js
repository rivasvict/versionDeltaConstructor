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

    this.prepareMethodologyModelVersionBuilder();
  };

  Version.prototype.prepareMethodologyModelVersionBuilder = function() {
    if (this.id && !this.methodologyModelDelta) {
      this.setMethodologyModelDelta();
    }
  };

  Version.prototype.setMethodologyModelDelta = function() {
    return new Promise(function(fulfill, reject) {
      this.loadMethodologyModelVersionBackboneFromId()
        .then(function(methodologyModelDelta) {
          this.methodologyModelDelta = methodologyModelDelta;
          this.setPossibleMethodologyModel(this.methodologyModel.bb_methodology_model);
          fulfill();
        }.bind(this))
        .catch(function(error) {
          console.log(error);
          reject();
        });
    }.bind(this));
  };

  Version.prototype.setPossibleMethodologyModel = function() {
    if (!this.methodologyModel) {
      this.setMethodologyModel();
    }
  };

  Version.prototype.setMethodologyModel = function(methodologyModelRelationString) {
    return new Promise(function(fulfill, reject) {
      dbInstance.get('gps.methodology_model', {
        id: methodologyModelId,
      })
        .then(function(methodologyModel) {
          this.methodologyModel = methodologyModel;
          fulfill();
        })
        .catch(function(error) {
          console.log(error);
          reject();
        });
    });
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
  });

  setTimeout(function() {console.log(myVersion)}, 3000);

})();
