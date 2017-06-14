const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const tokenDir = './tmp';
const tokenPath = `${tokenDir}/spreadsheet.json`;

const spreadsheetId = 'hogehoge';
const range = 'シート1!A:B';

fs.readFile('client_secret.json', (err, content) => {
  if (err) {
    console.log(err);
    return;
  }
  authorize(JSON.parse(content), listVoiceActor);
});

const authorize = ((credentials, callback) => {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new googleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  fs.readFile(tokenPath, (err, token) => {
    if (err) {
      console.log(err);
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
});

const getNewToken = ((oauth2Client, callback) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  console.log(`このURLにブラウザからアクセスしてみて ${authUrl}`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('コードを入力して: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log(err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
});

const storeToken = ((token) => {
  try {
    fs.mkdirSync(tokenDir);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(tokenPath, JSON.stringify(token));
  console.log(`${tokenPath}にトークンを保存します`);
});

const listVoiceActor = ((auth) => {
  console.log('pass');
  const sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: encodeURIComponent(range) // エンコードしないと取得できない
  }, (err, response) => {
    if (err) {
      console.log(err);
      return;
    }
    const rows = response.values;
    if (rows.length === 0) {
      console.log('データがないよ');
    } else {
      console.log(rows);
    }
  });
});
