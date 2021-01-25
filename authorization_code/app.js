//test update
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { userInfo } = require('os');
var SpotifyWebApi = require('spotify-web-api-node');
const { access, fstat } = require('fs');
const fs = require('fs');

var counter = 0;

 
// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: '78e6c06078b64ca6a10035adea9995ce',
  clientSecret: '0ca99a1d41954a9ebe812efdaab20956',
  redirectUri: 'https://researchspotifyapp-27t5c.ondigitalocean.app/callback'
});

var client_id = '78e6c06078b64ca6a10035adea9995ce'; // Your client id
var client_secret = '0ca99a1d41954a9ebe812efdaab20956'; // Your secret
var redirect_uri = 'https://researchspotifyapp-27t5c.ondigitalocean.app/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-top-read'; 
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // we can also pass the token to the browser to make requests from there
        
        

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }

      counter++;
        // Get top tracks
      spotifyApi.setAccessToken(access_token);
      spotifyApi.getMyTopTracks({ time_range: 'long_term', limit: '50'})
      .then(function(data) {
        let topTracks = data.body.items;
        console.log(counter);
        console.log(topTracks);
        var jsonString = JSON.stringify(topTracks, undefined, 4);
        fs.writeFileSync('spotifyDataTracks' +counter +'.json', jsonString, function(err) {console.log('Something went wrong!', err)});
  },  function(err) {
        console.log('Something went wrong!', err);
   });

   //Get top artists
   spotifyApi.getMyTopArtists({ time_range: 'long_term', limit: '50'})
   .then(function(data) {
     let topArtists = data.body.items;
     console.log(topArtists);
     var jason = JSON.stringify(topArtists, undefined, 4);
     fs.writeFileSync('spotifyDataArtists' +counter +'.json', jason, function(err) {console.log('Something went wrong!', err)});
     
     fs.writeFile('./public/counter.txt', counter, function (err) {
      if (err) throw err;
      console.log('Counter saved: ' +counter);
     }); 
   }, function(err) {
     console.log('Something went wrong!', err);
   });
   setTimeout(function(){res.redirect('https://researchspotifyapp-27t5c.ondigitalocean.app/callback');}, 1500) 
    });
  }
});





app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


console.log('Listening on 127.0.0.1:3000');
app.listen(3000);
