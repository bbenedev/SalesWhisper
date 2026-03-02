let mediaRecorder = null
let audioChunks = []
let recordingInterval = null

function createSuggestionBox() {
  if (document.getElementById('sw-suggestion-box')) return
  const box = document.createElement('div')
  box.id = 'sw-suggestion-box'
  box.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; width: 320px;
    background: #09090b; border: 1px solid #2563eb44; border-radius: 16px;
    padding: 16px; z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  `
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <div style="width:8px;height:8px;background:#22c55e;border-radius:50%;" id="sw-dot"></div>
      <span style="color:#a1a1aa;font-size:12px;font-weight:600;text-transform:uppercase;">SalesWhisper</span>
    </div>
    <div id="sw-suggestion-text" style="color:#93c5fd;font-size:13px;line-height:1.6">
      Listening to your call...
    </div>
  `
  document.body.appendChild(box)
}

function updateSuggestion(text) {
  const el = document.getElementById('sw-suggestion-text')
  if (el) el.textContent = text
}

function removeSuggestionBox() {
  const box = document.getElementById('sw-suggestion-box')
  if (box) box.remove()
  if (recordingInterval) clearInterval(recordingInterval)
}

async function startListening() {
  try {
    createSuggestionBox()
    updateSuggestion('Accessing microphone...')

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    updateSuggestion('Listening to your call...')

    const recordAndSend = () => {
      audioChunks = []
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        if (blob.size > 1000) {
          updateSuggestion('Analyzing...')
          const reader = new FileReader()
          reader.onloadend = () => {
            chrome.runtime.sendMessage({
              action: 'SEND_AUDIO_TO_BACKEND',
              audioData: reader.result,
              mimeType: 'audio/webm'
            }, (response) => {
              console.log('SalesWhisper: sent to background', response)
            })
          }
          reader.readAsDataURL(blob)
        }
      }

      mediaRecorder.start()
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 10000)
    }

    recordAndSend()
    recordingInterval = setInterval(recordAndSend, 12000)

  } catch (error) {
    updateSuggestion('⚠️ Microphone error: ' + error.message)
    console.error('SalesWhisper error:', error)
  }
}

function stopListening() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach(t => t.stop())
  }
  removeSuggestionBox()
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_LISTENING') {
    startListening()
    sendResponse({ success: true })
  }
  if (message.action === 'STOP_LISTENING') {
    stopListening()
    sendResponse({ success: true })
  }
  if (message.action === 'NEW_SUGGESTION') {
    updateSuggestion(message.suggestion)
  }
})