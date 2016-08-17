/**
 * Created by JSon on 16/8/16.
 */
require("babel-core/register")({
  presets: ["es2015", "stage-0"],
  env: {
    development: {}
  }
});
require("babel-polyfill");
var path = require('path');
var fs = require('fs');
var fetch = require('isomorphic-fetch');
var cheerio = require('cheerio');

let cookie = [];
let all_questions = {};
function getAnwsers(num) {
  return new Promise(resolve => {
    fetch(`http://ks.gdycjy.gov.cn/kQuestion.shtml?act=getHistory&pageSize=50&kAnswerInfoId=${num}`, {
      method: 'get'
    })
      .then(res => {
        cookie.push(res.headers.get('set-cookie')); //‌ JSESSIONID=26DDD727CEBB83994E18D40DA42614B3.web02; Path=/; HttpOnly
        return res.text();
      })
      .then(html => {
        let count = 0;
        const $ = cheerio.load(html);
        let $items = $('.txtMg');
        $items.map((i, v) => {

          const $item = $(v);

          const index = $item.find('li input').eq(0).attr('class').match(/\d+$/)[0];
          let answer = $item.find('li input:checked').parent().text().trim();

          // 题目中有显示“正确答案是”的话，即已选中答案为错误。因此只记录正确的答案与题目
          const $errorAnswer = $item.find('.xhx');
          if ($errorAnswer[0]) {
            const _index = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].indexOf($errorAnswer.val().trim().toLowerCase());
            answer = $item.find('li').eq(_index).text().trim();
          }

          if (all_questions[index]) {
            count++
          }
          const answers = [];
          $item.find('li').map((i, v)=> {
            answers.push($(v).text().trim());
          });
          all_questions[`${index}`] = {
            index,
            question: $item.find('span').text(),
            answers: answers,
            answer: {
              index: answer.split('.')[0],
              text: answer.split('.')[1]
            }
          };
        });

        resolve(count);
      });
  });
}
const promiseAry = [];
for (let i = 0; i <= 40; i++) {
  promiseAry.push(getAnwsers(i));
}
Promise.all(promiseAry).then(res => {
  const pathCookie = path.join(__dirname, '../data/cookie.txt');
  const pathAnwsers = path.join(__dirname, '../data/anwsers.json');
  fs.writeFile(pathCookie, cookie.join('\n'), function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("cookie saved to " + pathCookie);
    }
  });

  fs.writeFile(pathAnwsers, JSON.stringify(all_questions, null, 4), function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + pathAnwsers);
    }
  });
});
