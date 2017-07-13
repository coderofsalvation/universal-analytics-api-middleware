module.exports = function(opts){

		var ua = this.ua =  require('universal-analytics')
		if( opts.context  ) opts.context.ua = this
		var me = this
		// google analytics
		var visitor = this.visitor = false
		var gaBucket = {
				last: {
						event: false,
						timing: false,
						pageview: false
				},
				timeout:{
						timing: false,
						event: false,
						pageview: false
				}
		}

		if( (opts.GA_TOKEN && process.env.NODE_ENV == 'production') || process.env.GA_TEST ){
				visitor = ua( opts.GA_TOKEN )
		}

		this.bufferRequest = function( type, args ){
				if( ! gaBucket.last[type] ) gaBucket.last[type] = visitor[type].apply( visitor, args)
				else  gaBucket.last[type] = gaBucket.last[type][type].apply( visitor, args )
				// this will send all timings every 5 secs (and not more often)  
				if( gaBucket.timeout[type] !== false ) clearTimeout( gaBucket.timeout[type] )
				gaBucket.timeout[type] = setTimeout( function(){
						gaBucket.last[type].send()
						gaBucket.timeout[type] = false
				}, parseInt(opts.GA_BUFFERTIME) || 5000 )
		}

		this.timing = function(path,method,time){
				if( ! visitor ) return
				var args = ["request", method+" "+path, time ]
				this.bufferRequest( 'timing',args )
		}

		this.pageview = function(path,method,time){
				if( ! visitor ) return
				var args = [{dp:path,dt:method}]
				if( time ) me.timing(path, method, time)
				this.bufferRequest( 'pageview',args )
		}

		this.event = function(){
				if( ! visitor ) return
				var args = Array.prototype.slice.call(arguments)
				args.unshift( opts.name || "api" )
				this.bufferRequest( 'event',args )
		}

		// route console.error to ganalytics
		var error = console.error
		console.error = function(msg){
				if( process.ua && process.ua.visitor )
						process.ua.visitor.exception(msg).send()
				error.apply(this, [msg])
		}

		process.ua = this

		return function(req, res, next){
				if( req.url.match( opts.regex || new RegExp('[\.]','g' ) ) == null ){
						var now = new Date().getTime()
						req.starttime = now
						var restime = 99999999
						var send = res.send
						res.send = function(){
								restime = ( new Date().getTime() - now )
								me.pageview(req.url,req.method, restime)
								return send.apply(this, arguments )
						}
				}
				next()
		}

		// notify start
		process.ua.event('start / rebooted', 1)

		// measure cpu/memory
		try{
				var pusage = require('pidusage')
				setInterval( 30000, () => {
						pusage.stat(process.pid, function(err, stat) {
								if( !stat.cpu ) return
								process.ua.event("cpu", stat.cpu )
								process.ua.event("memory", stat.memory )
						})
				})
		} catch (err) {
				console.log("run 'NOTE: npm install pidusage' to get cpu/memory stats too")
		}

}.bind({})
