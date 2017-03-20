track your api usage using google universal analytycs 

![Build Status](https://travis-ci.org/--js.svg?branch=master)

## Usage

    $ npm install universal-analytics-api-middleware --save

in your app.js

                require('universal-analytics-api-middleware')({
                        "GA_TOKEN":"UA-09340980345",                     // your analytics token
                        "GA_BUFFERTIME": 5000,                           // buffer events and only send every 5 secs
                        "name":"myapi", 
                        "ignore":'[\.]',                                 // dont report files
                        "context":process                                // object to bind 'ua' to
                })


## Features

* buffers high volume of requests, and pushes in batch to analytics (instead of rightaway)
* automatically track api calls & responsetime as pageviews
* easily track your own events

Basically each request is buffered, and sent as google analytics events every `GA_BUFFERTIME` milliseconds.

You can view realtime requests at `Realtime > Events`,  or create dashboards to sort/display the events.

> NOTE: you can add events to analytics,  anywhere from within deployd :

    process.ua.event("action name", "label/value")      // buffered event (adviced)
    process.ua.timing("category", "actionname", 12)     // buffered event (adviced)
    console.error("something went wrong")               // sends exception 
    process.ua.visitor                                  // universal analytics object for unbuffered use 

}

for more info on `ua` usage see [docs](https://npmjs.org/package/universal-analytics)

> NOTE: this module also tracks the processing time of each request (see 'Server Response Time' in google analytics pageviews)
