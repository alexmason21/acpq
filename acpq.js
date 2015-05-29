// Generated by CoffeeScript 1.9.1
(function() {
  var TTS, acpq, client, colors, crypto, exec, fs, http, i, irc, j, len, os, querystring, ref, requestUrl, spawn, tts, url;

  os = require('os');

  fs = require('fs');

  http = require('http');

  spawn = require('child_process').spawn;

  exec = require('child_process').exec;

  url = require('url');

  crypto = require('crypto');

  querystring = require('querystring');

  colors = require('colors');

  irc = require('irc');

  acpq = {
    config: JSON.parse(fs.readFileSync('config.json', 'utf8')),
    voices: JSON.parse(fs.readFileSync('voices.json', 'utf8')),
    art: fs.readFileSync('art.txt').toString().split('\n')
  };

  acpq.voice = acpq.voices[acpq.config.speaker].voice;

  acpq.language = acpq.voices[acpq.config.speaker].language;

  ref = acpq.art;
  for (j = 0, len = ref.length; j < len; j++) {
    i = ref[j];
    console.log(i.cyan);
  }

  requestUrl = '/demo-tts/DemoHTML5Form_V2.php?langdemo=Powered+by+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-vaas.com%22%3EAcapela+Voice+as+a+Service%3C%2Fa%3E.+For+demo+and+evaluation+purpose+only%2C+for+commercial+use+of+generated+sound+files+please+go+to+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-box.com%22%3Ewww.acapela-box.com%3C%2Fa%3E';

  tts = null;

  process.title = "acpq @ " + acpq.config.speaker;

  TTS = (function() {
    function TTS() {
      this.queue = [];
      this.playing = false;
    }

    TTS.prototype.say = function(quote) {
      var o;
      o = {
        line: quote,
        link: '',
        file: null
      };
      this.queue.unshift(o);
      if (!this.playing && this.queue.length === 1) {
        this.fetch();
      }
      return true;
    };

    TTS.prototype.fetch = function() {
      var callback, data, e, hash, o, options, req, that;
      this.playing = true;
      o = this.queue.pop();
      hash = crypto.createHash('md5').update("" + acpq.voice + o.line).digest('hex');
      o.path = "store/" + hash + ".mp3";
      try {
        if (fs.lstatSync(o.path).isFile) {
          this.play(o.path);
          return;
        }
      } catch (_error) {
        e = _error;
      }
      that = this;
      data = querystring.stringify({
        MyLanguages: acpq.language,
        MySelectedVoice: acpq.voice,
        MyTextForTTS: o.line,
        t: 1,
        SendToVaaS: 0
      });
      options = {
        host: 'www.acapela-group.com',
        path: requestUrl,
        method: 'POST',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,nl;q=0.6',
          'Cache-Control': 'max-age=0',
          'Connection': 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 0,
          'Host': 'www.acapela-group.com',
          'Origin': 'http://www.acapela-group.com',
          'Referer': 'http://www.acapela-group.com/demo-tts/DemoHTML5Form_V2.php?langdemo=Powered+by+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-vaas.com%22%3EAcapela+Voice+as+a+Service%3C%2Fa%3E.+For+demo+and+evaluation+purpose+only%2C+for+commercial+use+of+generated+sound+files+please+go+to+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-box.com%22%3Ewww.acapela-box.com%3C%2Fa%3E',
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36',
          'Content-Length': data.length
        }
      };
      callback = function(response) {
        that.demo = '';
        response.on('data', function(chunk) {
          that.demo += chunk;
        });
        return response.on('end', function() {
          that.geturl(o);
        });
      };
      req = http.request(options, callback);
      req.write(data);
      req.end();
      return true;
    };

    TTS.prototype.geturl = function(o) {
      var ba;
      ba = /var myPhpVar = '[^']+/g.exec(this.demo);
      if (ba == null) {
        console.log('could not huck'.red);
        return;
      }
      ba = String(ba);
      o.link = ba.substr(16);
      this.download(o);
      return true;
    };

    TTS.prototype.download = function(o) {
      var file, options, that;
      that = this;
      file = fs.createWriteStream(o.path);
      options = {
        host: url.parse(o.link).host,
        path: url.parse(o.link).pathname
      };
      http.get(options, function(res) {
        res.on('data', function(data) {
          return file.write(data);
        });
        return res.on('end', function() {
          file.end();
          return that.play(o.path);
        });
      });
      return true;
    };

    TTS.prototype.play = function(file) {
      var that, vlc;
      that = this;
      vlc = exec("\"E:/Program Files (x86)/VideoLAN/VLC/vlc.exe\" -Idummy " + file + " vlc://quit");
      vlc.on('exit', function(code) {
        return that.next();
      });
      return true;
    };

    TTS.prototype.next = function() {
      this.playing = false;
      if (this.queue.length) {
        this.fetch();
      }
      return true;
    };

    return TTS;

  })();

  tts = new TTS;

  client = new irc.Client('149.210.223.123', 'acpq', {
    debug: false,
    channels: ['#gta'],
    port: 6667,
    autoRejoin: true
  });

  client.addListener('error', function(message) {});

  client.addListener('message', function(from, to, message) {
    tts.say(message);
  });

  client.join('#gta');

}).call(this);
