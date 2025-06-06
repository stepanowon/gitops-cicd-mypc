'use strict';

const express = require('express');
const os = require('os');
// 
const PORT = 8080;
const HOST = '0.0.0.0';

// 
const app = express();
app.get('/:reqpath', (req, res) => {
  return res.status(200).send(`
  <div style="background-color:aqua">
    <h2> nodeapp-path1</h2>
    <h2> 호스트명 : ${os.hostname()} </h2>
    <h2> 요청경로 : ${req.params.reqpath} </h2>
  </div>
  `);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
