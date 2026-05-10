import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[VibeGuessr UI] render failed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error-page">
          <div className="app-error-panel">
            <div className="app-error-eyebrow">前端渲染异常</div>
            <h1>页面加载失败</h1>
            <p>{this.state.error.message || '未知错误'}</p>
            <button type="button" onClick={() => window.location.reload()}>
              重新加载
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
