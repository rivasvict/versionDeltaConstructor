var Version = require('./methodologyModelVersion');

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

myVersion.prepareMethodologyModelVersionBuilder()
  .then(function(versionModel) {
    versionModel.buildVersion();
  })
  .catch(function(error) {
    console.log(error);
  });
