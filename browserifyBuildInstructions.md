Use the following command to get the Version module available in the browser

For when you do have the dependencies on the client:
`browserify -x underscore -x axios -x bluebird index.js --s Version  >
methodologyModel.js`

For when you do not have the dependencies on the client
`browserify index.js --s Version  >
methodologyModel.js`
