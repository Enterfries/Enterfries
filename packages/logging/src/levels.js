const DEFAULT_PRIORITY = Number.MAX_SAFE_INTEGER


export default function createLevelsModule (levelsMap) {
  let loggingPriority = DEFAULT_PRIORITY

  function getPriority (level) {
    return levelsMap.has(level)
      ? levelsMap.get(level).priority
      : DEFAULT_PRIORITY
  }

  function getStream (level) {
    return levelsMap.has(level)
      ? levelsMap.get(level).stream
      : undefined
  }

  function addLevel (level, { stream, priority }) {
    levelsMap.set(level, {
      stream,
      priority,
    })
  }

  const priority = {
    set: level => (loggingPriority = getPriority(level)),
    get: () => loggingPriority,
  }

  return {
    addLevel,
    getPriority,
    getStream,
    priority,
  }
}


