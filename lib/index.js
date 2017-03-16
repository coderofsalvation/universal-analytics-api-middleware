module.exports = function(opts){ 

  var ua = this.ua = process.ua =require('universal-analytics')
  var me = this
  // google analytics
  var visitor = this.visitor = false
  var gaBucket = {
    last: {
      event: false,
      timing: false,
      pageView: false
    },
    timeout:{
      eventTiming: false,
      eventSend: false,
      pageViewSend: false
    }
  }

  this.init = function(){
    if( opts.GA_TOKEN && process.env.NODE_ENV == 'production' )
      visitor = ua( opts.GA_TOKEN )
  }

	this.bufferRequest = function( type, method, args ){
    if( ! gaBucket.last[type] ) gaBucket.last[type] = visitor[method].apply( visitor, args)
    else gaBucket.last[type] = gaBucket.last[type][method].apply( visitor, args )
    gaBucket.last[type] = gaBucket.last[type][method].apply( visitor, ["request", method+" "+path, time] )
    // this will send all timings every 5 secs (and not more often)  
    if( gaBucket.timeout[type] !== false ) clearTimeout( gaBucket.timeout[type] )
    gaBucket.timeout[type] = setTimeout( function(){
      gaBucket.last[type].send()
      gaBucket.timeout[type] = false
    }, parseInt(opts.GA_BUFFERTIME) || 5000 )
	}

  this.timing = function(path,method,time){
    if( ! visitor ) return
    var args = [{dp:path,dt:method, srt:time}]
		this.bufferRequest( 'pageTiming', 'timing',args )
  }
  
  this.pageview = function(path,method,time){
    if( ! visitor ) return
    var args = [{dp:path,dt:method}]
    if( time ) me.timing(path, method, time)
		this.bufferRequest( 'pageView', 'pageview',args )
  }

  this.event = function(){
    if( ! visitor ) return
    var args = Array.prototype.slice.call(arguments)
    args.unshift( opts.name || "api" )
		this.bufferRequest( 'eventSend','event',args )
  }

  // route console.error to ganalytics
  var error = console.error
  console.error = function(msg){
    if( process.ua && process.ua.visitor )
      process.ua.visitor.exception(msg).send()
    error.apply(this, [msg])
  }

  return function(req, res, next){
		var now = new Date().getTime()
		req.starttime = now
		var restime = 99999999
		var end = res.end
		res.end = function(){
			restime = ( new Date().getTime() - now )
			me.ua.pageview(req.url,req.method, restime)
			return end.apply(this, arguments )
		}
		next()
	}

}.apply({})
