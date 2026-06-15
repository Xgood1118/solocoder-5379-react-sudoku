import React, { useState } from 'react'

function ShareModal({ shareUrl, replayUrl, onClose }) {
  const [copied, setCopied] = useState('')

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  return (
    <div className="share-modal" onClick={onClose}>
      <div className="share-modal-content" onClick={e => e.stopPropagation()}>
        <h2>分享</h2>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '8px', fontWeight: '500' }}>分享题目（好友可以做同一道题）</p>
          <div className="share-url">
            <input type="text" value={shareUrl} readOnly />
            <button
              className={`btn ${copied === 'puzzle' ? 'btn-success' : 'btn-primary'}`}
              onClick={() => copyToClipboard(shareUrl, 'puzzle')}
            >
              {copied === 'puzzle' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ marginBottom: '8px', fontWeight: '500' }}>分享回放（好友可以看你的解题过程）</p>
          <div className="share-url">
            <input type="text" value={replayUrl} readOnly />
            <button
              className={`btn ${copied === 'replay' ? 'btn-success' : 'btn-primary'}`}
              onClick={() => copyToClipboard(replayUrl, 'replay')}
            >
              {copied === 'replay' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <button className="btn" onClick={onClose} style={{ width: '100%' }}>
          关闭
        </button>
      </div>
    </div>
  )
}

export default ShareModal
