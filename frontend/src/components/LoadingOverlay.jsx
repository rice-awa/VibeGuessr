import './LoadingOverlay.css'

function LoadingOverlay({ text, fullscreen = true }) {
  const content = (
    <div className="lo-content">
      <div className="lo-dots">
        <span /><span /><span />
      </div>
      <p className="lo-text">{text || '加载中...'}</p>
    </div>
  )

  if (!fullscreen) {
    return <div className="lo-inline">{content}</div>
  }

  return (
    <div className="lo-overlay">
      {content}
    </div>
  )
}

export default LoadingOverlay
