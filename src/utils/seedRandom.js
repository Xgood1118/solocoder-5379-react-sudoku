export function createSeededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  
  return function() {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function shuffleArray(arr, random) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateSeed() {
  return Math.floor(Math.random() * 2147483646) + 1
}

export function encodeSeed(seed) {
  return seed.toString(36)
}

export function decodeSeed(str) {
  return parseInt(str, 36)
}
