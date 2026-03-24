import { useEffect, useMemo } from 'react'
import { initLandingPage } from './scripts/landing.js'
import { initDashboardPage } from './scripts/dashboard.js'
import { initMapPage } from './scripts/app.js'
import { initDetailPage } from './scripts/detail.js'

function LandingView() {
  return (
    <>
      <canvas id="landing-canvas"></canvas>
      <div className="landing-container fade-in">
        <div className="logo-area"></div>
        <h1 className="main-title">生活地图</h1>
        <p className="subtitle mono">DIGITALIZE YOUR FOOTPRINTS // 记录生活的每一步</p>
        <div className="enter-btn-wrapper">
          <button id="enter-btn" className="btn-primary">初始化系统</button>
        </div>
        <div className="coordinate-decoration mono">
          纬度: 39.9042<br />经度: 116.4074
        </div>
        <div className="version-decoration mono">系统版本 1.0.0</div>
      </div>
    </>
  )
}

function DashboardView() {
  return (
    <div className="dashboard-layout fade-in">
      <header>
        <div className="dashboard-title">
          <h1>旅行日志</h1>
          <p className="mono">用户: 旅行者_01</p>
        </div>
        <div className="user-status mono">状态: 在线</div>
      </header>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label mono">足迹总数</div>
          <div id="stat-count" className="stat-value mono">0</div>
          <div className="stat-desc">已记录的珍贵记忆</div>
        </div>
      </div>
      <div className="recent-section">
        <div className="section-header">
          <h2>最近更新</h2>
          <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.6 }}>LATEST_UPDATES</div>
        </div>
        <div id="log-list" className="log-list"></div>
      </div>
      <div className="recent-section">
        <div className="section-header">
          <h2>我的路线</h2>
          <div className="header-actions">
            <button id="btn-create-route" className="btn-sm">+ 新建路线</button>
          </div>
        </div>
        <div id="route-list" className="log-list"></div>
      </div>
      <div className="dashboard-actions">
        <button id="btn-open-map" className="btn-primary">打开全域地图</button>
      </div>
    </div>
  )
}

function MapView() {
  return (
    <div id="app">
      <nav id="sidebar-nav">
        <div className="nav-item" id="nav-home" title="返回仪表盘">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item active" id="nav-search" title="搜索">
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <div className="nav-item" id="nav-route" title="路线规划">
          <i className="fa-solid fa-route"></i>
        </div>
      </nav>
      <div id="sidebar-panel-container">
        <div id="panel-search" className="sidebar-panel active">
          <div className="panel-header">
            <h2>探索</h2>
          </div>
          <div className="panel-content">
            <div className="search-container">
              <input type="text" id="search-input" placeholder="搜索地点..." />
            </div>
          </div>
        </div>
        <div id="panel-route" className="sidebar-panel">
          <div className="editor-header">
            <h2>路线规划</h2>
          </div>
          <div className="editor-form">
            <div className="form-group">
              <label htmlFor="route-name">路线名称</label>
              <input type="text" id="route-name" placeholder="给你的旅程起个名字" />
            </div>
            <div className="route-points-container">
              <div className="timeline-line"></div>
              <div id="route-points-list" className="route-points-list">
                <div className="empty-route-hint">点击地图上的地点添加到路线</div>
              </div>
            </div>
            <div className="route-actions">
              <button id="delete-route-btn" className="btn-text-danger">删除路线</button>
            </div>
          </div>
        </div>
      </div>
      <div id="map"></div>
      <div id="card-editor" className="card-editor">
        <div className="editor-header">
          <h2>地点记忆</h2>
          <button className="close-btn">&times;</button>
        </div>
        <div className="editor-form">
          <input type="hidden" id="place-id" />
          <input type="hidden" id="place-lat" />
          <input type="hidden" id="place-lng" />
          <div className="form-group">
            <label htmlFor="place-title">标题</label>
            <input type="text" id="place-title" placeholder="地点名称" />
          </div>
          <div className="form-group">
            <label htmlFor="place-date">日期</label>
            <input type="date" id="place-date" />
          </div>
          <div className="form-group">
            <label htmlFor="place-content">故事</label>
            <textarea id="place-content" placeholder="记录下这里发生的事..."></textarea>
          </div>
          <div className="form-group">
            <label>照片</label>
            <input type="file" id="place-images" accept="image/*" multiple />
            <div id="image-preview-container" className="image-preview-container"></div>
          </div>
          <button id="save-btn" className="save-btn">保存记忆</button>
          <button id="delete-btn" className="delete-btn" style={{ display: 'none' }}>删除</button>
        </div>
      </div>
    </div>
  )
}

function DetailView() {
  return (
    <div className="detail-container fade-in">
      <header className="detail-header">
        <button id="btn-back" className="btn-text">← 返回仪表盘</button>
        <div className="header-actions">
          <button id="btn-fly-to" className="btn-secondary">📍 回到这里</button>
          <button id="btn-save" className="btn-primary" disabled>保存修改</button>
        </div>
      </header>
      <main className="diary-paper">
        <div className="diary-meta mono">
          <span id="diary-date">2023-10-01</span> | <span id="diary-coords">39.90, 116.40</span>
        </div>
        <input type="text" id="diary-title" className="diary-title-input" placeholder="无标题" autoComplete="off" />
        <textarea id="diary-content" className="diary-content-input" placeholder="记录下此刻的心情..."></textarea>
      </main>
    </div>
  )
}

export function App() {
  const route = useMemo(() => {
    const pathname = window.location.pathname.toLowerCase()
    if (pathname === '/dashboard' || pathname === '/dashboard.html') return 'dashboard'
    if (pathname === '/map' || pathname === '/map.html') return 'map'
    if (pathname === '/detail' || pathname === '/detail.html') return 'detail'
    return 'landing'
  }, [])

  useEffect(() => {
    if (route === 'landing') {
      initLandingPage()
      return
    }
    if (route === 'dashboard') {
      initDashboardPage()
      return
    }
    if (route === 'map') {
      initMapPage()
      return
    }
    initDetailPage()
  }, [route])

  if (route === 'dashboard') return <DashboardView />
  if (route === 'map') return <MapView />
  if (route === 'detail') return <DetailView />
  return <LandingView />
}
