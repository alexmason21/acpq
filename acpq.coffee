os = require('os')
fs = require('fs')
http = require('http')
spawn = require('child_process').spawn
exec = require('child_process').exec

url = require('url')
crypto = require('crypto')
querystring = require('querystring')

colors = require('colors')
irc = require('irc')

art = fs.readFileSync('art.txt').toString().split '\n'
for i in art
	console.log i.cyan

requestUrl = '/demo-tts/DemoHTML5Form_V2.php?langdemo=Powered+by+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-vaas.com%22%3EAcapela+Voice+as+a+Service%3C%2Fa%3E.+For+demo+and+evaluation+purpose+only%2C+for+commercial+use+of+generated+sound+files+please+go+to+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-box.com%22%3Ewww.acapela-box.com%3C%2Fa%3E'

tts = null

class TTS
	constructor: ->
		@queue = []
		@playing = false

		@language = 'sonid10'
		@voice = 'Sharon'

	say: (quote) ->
		o = line: quote, link: '', file: null
		@queue.push o
		@fetch() if not @playing and @queue.length is 1
		true

	fetch: ->
		@playing = true

		o = @queue.pop()

		hash = crypto.createHash('md5').update("#{@voice}#{o.line}").digest('hex')
		o.path = "store/#{hash}.mp3"

		try
			if fs.lstatSync(o.path).isFile
				@play o.path
				return
		catch e
			;

		that = this

		data = querystring.stringify
			MyLanguages: @language
			MySelectedVoice: @voice
			MyTextForTTS: o.line
			t: 1
			SendToVaaS: 0

		options =
			host: 'www.acapela-group.com'
			path: requestUrl
			method: 'POST'
			headers:
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
				'Accept-Encoding':'gzip, deflate'
				'Accept-Language':'en-US,en;q=0.8,nl;q=0.6'
				'Cache-Control':'max-age=0'
				'Connection':'keep-alive'
				'Content-Type':'application/x-www-form-urlencoded'
				'Cookie': 0
				'Host':'www.acapela-group.com'
				'Origin':'http://www.acapela-group.com'
				'Referer':'http://www.acapela-group.com/demo-tts/DemoHTML5Form_V2.php?langdemo=Powered+by+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-vaas.com%22%3EAcapela+Voice+as+a+Service%3C%2Fa%3E.+For+demo+and+evaluation+purpose+only%2C+for+commercial+use+of+generated+sound+files+please+go+to+%3Ca+href%3D%22http%3A%2F%2Fwww.acapela-box.com%22%3Ewww.acapela-box.com%3C%2Fa%3E'
				'User-Agent':'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36'
				'Content-Length': data.length				

		callback = (response) ->
			that.demo = ''

			response.on 'data', (chunk) ->
				that.demo += chunk
				return

			response.on 'end', ->
				that.geturl o
				return

		req = http.request options, callback

		req.write data
		req.end()

		true

	geturl: (o) ->
		# fs.writeFile 'demo.html', @demo

		ba = /var myPhpVar = '[^']+/g.exec @demo
		if not ba?
			console.log 'could not huck'.red
			return

		ba = String ba
		o.link = ba.substr 16

		@download o
		
		true

	download: (o) ->
		that = this

		file = fs.createWriteStream o.path

		options =
			host: url.parse(o.link).host
			path: url.parse(o.link).pathname

		http.get options, (res) ->
			res.on 'data', (data) -> file.write(data)
			res.on 'end', ->
				file.end()
				that.play o.path

		true

	play: (file) ->
		that = this
		vlc = exec "\"E:/Program Files (x86)/VideoLAN/VLC/vlc.exe\" -Idummy #{file} vlc://quit"
		vlc.on 'exit', (code) -> that.next()
		true
	
	next: ->
		@playing = false
		@fetch() if @queue.length
		true


tts = new TTS

client = new irc.Client '149.210.223.123', 'acpq',
	debug: no
	channels: ['#gta']
	port: 6667

client.addListener 'error', (message) ->
	#console.log 'error'
	#console.log message
	return
	
client.addListener 'message', (from, to, message) ->
	tts.say message
	return
	# console.log "#{from} => #{to}: #{message}"



client.join '#gta'
#client.send('MODE', '#gta', '+o', 'Guy acpq');
#client.say '#gta', "Not your friend"



