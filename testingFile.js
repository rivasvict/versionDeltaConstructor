var Version = require('./methodologyModelVersion');

// For node Generig implementation
var myVersion = new Version({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
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
var myVersion = new Version({
  methodologyModelVersionId: 'e8b082d1-e5c6-4bae-a1ce-fbb930baa271',
  methodologyModelId: '0C4932BC-D9EE-FE76-FFCE-916E30D09C00',
  //methodologyModel can be sent as a parameter to build the questionnaire remember NOT to send the methodologyModelId
  connectionConfiguration: {
    baseUrl: PLUGIN_API_URL,
  },
});

myVersion.build({
  //removeOriginalQuestionnaire: true,        // For removing the original questionnaire from the version object
  //keepOroginalQuestionnaire: true,          // For keeping the original questionnaire from the version object
})
  .then(function(versionedQuestionnaire) {
    console.log(versionedQuestionnaire);
  })
  .catch(function(error) {
    console.log(error);
  });
