/**
 * Created by JSon on 16/8/16.
 */

import { getForm, submit } from './submit.js';
var fs = require('fs');
var fetch = require('isomorphic-fetch');
var cheerio = require('cheerio');
var querystring = require('querystring');

var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
  getForm(req).then(obj => {
    res.render('index', obj);
  });
});

router.post('/', function (req, res, next) {
  submit(req).then(answer => {
    console.log(answer)
    res.send(answer);
  });
});

router.post('/dzTest.shtml', function (req, res, next) {
  fetch(`http://ks.gdycjy.gov.cn${req.url}`, {
    method: 'post',
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: querystring.stringify(req.body)
  }).then(res=>res.json())
    .then(json=> {
      res.send(json)
    })
    .catch(err=>console.error(err));
});


module.exports = router;
