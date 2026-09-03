import React from 'react'
import './AppLoader.css'

export default function AppLoader({ status = 'Connecting...' }) {
  return (
    <div className="appLoaderRoot" role="status" aria-live="polite" aria-busy="true">
      <div className="appLoaderContainer">
        <div className="appLoaderLogoWrapper">
          <div className="appLoaderPulseRing" />
          <div className="appLoaderPulseRing appLoaderPulseRing--delay" />
          <div className="appLoaderBadge">
            <span>K</span>
          </div>
          <div className="appLoaderOrbitSpinner" />
        </div>

        <div className="appLoaderTextRow">
          <div className="appLoaderBrand">KripaConnect</div>
          {status && <div className="appLoaderStatus">{status}</div>}
        </div>

        <div className="appLoaderProgressBar" aria-hidden="true">
          <div className="appLoaderProgressFill" />
        </div>
      </div>
    </div>
  )
}
