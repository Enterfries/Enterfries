export default function createMiddlewareModule (middleware) {
  function applyMiddleware (loggingEvent) {
    return middleware
      .reduce((event, func) => func(event), loggingEvent)
  }


  function addMiddleware (middleware, func) {
    middleware.push(func)
  }

  return {
    addMiddleware,
    applyMiddleware,
  }
}


export function addTimestamp (event) {
  return {
    ...event,
    timestamp: (new Date()).toISOString(),
  }
}


export function flattenEvents (event) {
  event.event = Array.isArray(event.event) && event.event.length === 1
    ? event.event[0]
    : event.event

  return event
}


export function niceErrors (event) {
  if (event.event instanceof Error) {
    event.event = {
      message: event.event.message,
      stack: event.event.stack,
    }
  }

  return event
}
