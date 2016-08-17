/**
 * Created by JSon on 16/8/16.
 */
var path = require('path');
var fs = require('fs');
var fetch = require('isomorphic-fetch');
var cheerio = require('cheerio');
var querystring = require('querystring');
let cookie = 'JSESSIONID=4127E4C68646336CE3D5DDD189C6C9B5.web02';
const headers = {
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'accept-encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
  'Connection': 'keep-alive',
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  'Host': 'ks.gdycjy.gov.cn',
  'Referer': 'http://ks.gdycjy.gov.cn/index.jsp',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:47.0) Gecko/20100101 Firefox/47.0',
  'X-Requested-With': 'XMLHttpRequest'
}

export function getForm(req) {
  return new Promise(resolve => {
    fetch('http://ks.gdycjy.gov.cn/index.jsp', {
      method: 'get'
    })
      .then(res => {
        req.session._cookie = res.headers.get('set-cookie');
        return res.text();
      })
      .then(html=> {
        return new Promise(resolve => {
          const formObj = {};
          const $ = cheerio.load(html);
          const $form = $('#myForm');

          $form.find('[name]').map((i, v) => {
            const index = $(v).parents('td').find('span:first-child').text().trim();
            formObj[index || i] = $(v).attr('name');
          });
          resolve($form.html())
        });
      })
      .then(formObj => {
        const data = Math.random();
        fetch(`http://ks.gdycjy.gov.cn/patchca.png?${data}`, {
          method: 'get',
          credentials: 'include',
          headers: Object.assign({}, headers, {
            "cookie": req.session._cookie
          })
        })
          .then(res => {
            return res.buffer();
          })
          .then(blob => {
            const pathImage = path.join(__dirname, '../data/image.png');
            fs.writeFile(pathImage, blob, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("JSON saved to " + pathImage);
              }
            });
            resolve({
              formObj,
              image: blob.toString("base64")
            });
          })
          .catch(err => console.error(err));
      });
  });
}

export function submit(req) {
  const obj = req.body;
  return new Promise((resolve, reject)=> {
    fetch(`http://ks.gdycjy.gov.cn/kQuestion.shtml?act=patchcaValidate&patchcafield=${obj.patchcafield}`, {
      method: 'post',
      credentials: 'include',
      headers: Object.assign({}, headers, {
        "cookie": req.session._cookie
      }),
      body: `suggest=${obj.patchcafield}`
    }).then(res => {
      fetch(`http://ks.gdycjy.gov.cn/kQuestion.shtml?act=saveKUserPlayer&patchca=${obj.patchcafield}`, {
        method: 'post',
        credentials: 'include',
        headers: Object.assign({}, headers, {
          "cookie": req.session._cookie
        }),
        body: querystring.stringify(obj)
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          if (!json.success) {
            reject(json);
            return false;
          }
          fetch(`http://ks.gdycjy.gov.cn/kQuestion.shtml?act=startAnswerQuestion&uuid=${json.msg}`, {
            method: 'get',
            credentials: 'include',
            headers: Object.assign({}, headers, {
              "cookie": req.session._cookie
            })
          });

          return new Promise(resolve => {
            fetch(`http://ks.gdycjy.gov.cn/kQuestion.shtml?act=getQuestions`, {
              method: 'post',
              credentials: 'include',
              headers: Object.assign({}, headers, {
                "cookie": req.session._cookie
              }),
              body: querystring.stringify({
                pageNo: 1,
                pageSize: 50,
                uuid: json.msg
              })
            }).then(res => {
              res.text().then(html => {
                resolve({
                  html,
                  uuid: json.msg
                });
              });
            })

          });
        })
        .then(obj => {
          console.log(obj.html);
          const $ = cheerio.load(obj.html);
          const pathAnwsers = path.join(__dirname, '../data/anwsers.json');
          fs.readFile(pathAnwsers, 'utf8', function (err, data) {
            if (err) throw err;
            if (!err) {
              const anwsers = Object.assign({}, JSON.parse(data));
              let $items = $('.txtMg');
              const answerList = [];
              $items.map((i, v) => {
                const $item = $(v);
                const index = $item.find('li input').eq(0).attr('class').match(/\d+$/)[0];
                const _indexAnswer = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].indexOf(anwsers[index].answer.index.toLowerCase());
                const $answer = $item.find('li input').eq(_indexAnswer);
                let answer = $answer.val();
                answerList.push(`${index}:${answer}`); // 116:346,
              });
              const answerStr = answerList.join(',');
              req.session._cookie += `; kOwnerAnswer=${encodeURIComponent(answerStr)}`;
              const url = `http://ks.gdycjy.gov.cn/kQuestion.shtml?act=submitOwnerAnswer&uuid=${obj.uuid}&ownerAnswer=${answerStr}`;
              setTimeout(() => {
                fetch(url, {
                  method: 'get',
                  credentials: 'include',
                  headers: Object.assign({}, headers, {
                    "cookie": req.session._cookie
                  }),
                  body: querystring.stringify({
                    pageNo: 1,
                    pageSize: 50,
                    uuid: obj.uuid
                  })
                }).then(res => res.json())
                  .then(json => {
                    resolve(json)
                  });
              }, 30000);
            }
          });

        });
    });
  });
}

