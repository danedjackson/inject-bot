const axios = require('axios');



module.exports = async function () {
    var count;
    await axios.get('https://server-count.herokuapp.com/serv-count')
    .then(function (response) {
        // handle success
        console.log(response)
    })
    .catch(function (error) {
        // handle error
        console.log("Error: " + error.message);
    })
    .then(function () {
        // always executed
    });
}
