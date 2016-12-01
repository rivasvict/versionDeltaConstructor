var MethodologyModelVersion = require('./methodologyModelVersion');

// For node Generig implementation
var myVersion = new MethodologyModelVersion({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
  //methodologyModel can be sent as a parameter to build the questionnaire remember NOT to send the methodologyModelId
  connectionConfiguration: {
    domainProtocol: 'http://',
    host: 'localhost',
    port: '9000',
    headers: {
      'X-BAASBOX-APPCODE': '1234567890',
      'Authorization': 'Basic YWRtaW46YWRtaW4=',
    },
  },
});

// For gps client app
/*var myVersion = new MethodologyModelVersion({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
  //methodologyModel can be sent as a parameter to build the questionnaire remember NOT to send the methodologyModelId
  connectionConfiguration: {
    baseUrl: PLUGIN_API_URL,
  },
});*/

myVersion.build({
  //To handle which attributes remain in the object, use the options bellow (all necessary data is sent on the promise
  //fulfillment)
  //By default the object only keeps methodology model id and methodology model version id
  // After using keepAllObjectData you can use the removal options to delete elements from the original object
  //keepAllObjectData: true,                            // For keeping all object data
  //removeOriginalQuestionnaireFromTheObject: true,   // For removing the original questionnaire from the version object
  //removeVersionedQuestionnaireOnTheObject: true,    // For keeping the versioned questionnaire on the object
  //removeMethodologyModelDeltaOnTheObject: true,       // For keeping the methodologu model delta on the object
})
  .then(function(methodologyModelVersion) {
    console.log(methodologyModelVersion);
  })
  .catch(function(error) {
    console.log(error);
  });
