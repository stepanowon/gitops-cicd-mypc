'use strict';

const express = require('express');
const os = require('os');
// 
const PORT = 8080;
const HOST = '0.0.0.0';

// 이 예제는 ConfigMap의 값을 환경변수로 전달
// 볼륨으로 마운트할수도 있음.
const app = express();
app.get('/', (req, res) => {
  return res.status(200).send(`
    호스트명 : ${os.hostname()} 
    
    MYSQL_ENDPOINT: ${process.env.MYSQL_ENDPOINT}
    API_KEY: ${process.env.APIKEY}
    
    DB_USERID : ${process.env.DB_USERID}
    DB_PASSWORD : ${process.env.DB_PASSWORD}
  `);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
