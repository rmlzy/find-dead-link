#!/usr/bin/env node

const cac = require('cac');
const update = require('update-notifier');
const axios = require('axios');
const cheerio = require('cheerio');
const ProgressBar = require('progress');
const pkg = require('./package');

const cli = cac('fdl');

const checkGithubUrl = async (url) => {
  let valid = false;
  try {
    await axios.get(url);
    valid = true;
  } catch (e) {
    // ignore
  }
  return valid;
};

cli
  .command('<url>', 'Find dead link in github README.')
  .action(async function (url) {
    try {
      const r = await axios.get(url);
      const $ = cheerio.load(r.data);
      const urls = [];
      $("div[data-target='readme-toc.content'] a").each(function () {
        const href = $(this).attr('href');
        if (href && href.startsWith('http')) {
          urls.push(href);
        }
      });

      const githubLinks = urls.filter((url) =>
        url.startsWith('https://github.com')
      );
      const deadLinks = [];
      console.log('Start...');
      const progressBar = new ProgressBar(':bar :current/:total', {
        total: githubLinks.length
      });
      for (let i = 1; i <= githubLinks.length; i++) {
        const url = githubLinks[i];
        const valid = await checkGithubUrl(url);
        if (!valid) {
          deadLinks.push(url);
        }
        progressBar.tick();
      }
      if (deadLinks.length) {
        console.log(`Got ${deadLinks.length} dead links:`);
        deadLinks.forEach((link) => console.log(link));
      } else {
        console.log('Every link is correct.');
      }
    } catch (e) {
      console.log(e);
    }
  });

cli.version(pkg.version);
cli.help();
cli.parse();

update({ pkg }).notify();
