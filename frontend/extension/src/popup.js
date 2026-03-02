const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const statusDot = document.getElementById('statusDot')
const statusText = document.getElementById('statusText')
const suggestionsSection = document.getElementById('suggestionsSection')
const suggestionText = document.getElementById('suggestionText')

startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  chrome.tabs.sendMessage(tab.id, { action: 'START_LISTENING' })
  
  startBtn.style.display = 'none'
  stopBtn.style.display = 'block'
  statusDot.classList.add('active')
  statusText.textContent = 'Listening...'
  suggestionsSection.style.display = 'block'
  suggestionText.textContent = 'Waiting for conversation...'
  chrome.storage.local.set({ isListening: true })
})

stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  chrome.tabs.sendMessage(tab.id, { action: 'STOP_LISTENING' })

  stopBtn.style.display = 'none'
  startBtn.style.display = 'block'
  statusDot.classList.remove('active')
  statusText.textContent = 'Not listening'
  suggestionsSection.style.display = 'none'
  chrome.storage.local.set({ isListening: false })
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'NEW_SUGGESTION') {
    suggestionText.textContent = message.suggestion
  }
  if (message.action === 'ERROR') {
    suggestionText.textContent = '⚠️ ' + message.message
    suggestionText.style.color = '#f87171'
  }
})

chrome.storage.local.get(['isListening'], (result) => {
  if (result.isListening) {
    startBtn.style.display = 'none'
    stopBtn.style.display = 'block'
    statusDot.classList.add('active')
    statusText.textContent = 'Listening...'
    suggestionsSection.style.display = 'block'
  }
})