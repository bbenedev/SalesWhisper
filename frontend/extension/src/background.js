chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SEND_AUDIO_TO_BACKEND') {
    const byteString = atob(message.audioData.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: message.mimeType })
    const formData = new FormData()
    formData.append('audio', blob, 'audio.webm')

    fetch('http://localhost:8000/transcribe', {
      method: 'POST',
      body: formData
    })
    .then(r => r.json())
    .then(data => {
      if (data.suggestion && sender.tab) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'NEW_SUGGESTION',
          suggestion: data.suggestion
        })
      }
    })
    .catch(err => console.error('SalesWhisper backend error:', err))
    return true
  }
})