import { useState, useRef } from 'react'
import {
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiTrash2,
  FiRefreshCw
} from 'react-icons/fi'
import { importProductsCsv, downloadCsvTemplate } from '../../services/admin'
import './CsvImportModal.css'

const SUPPORTED_COLUMNS = [
  { name: 'name', required: true },
  { name: 'price', required: true },
  { name: 'retailer_price', required: false },
  { name: 'price_bulk', required: false },
  { name: 'min_bulk_qty', required: false },
  { name: 'stock', required: false },
  { name: 'category', required: false },
  { name: 'subcategory', required: false },
  { name: 'description', required: false },
  { name: 'images', required: false },
  { name: 'tags', required: false },
  { name: 'active', required: false },
]

export default function CsvImportModal({ token, isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [updateExisting, setUpdateExisting] = useState(true)
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file (.csv)')
      return
    }
    setError('')
    setResult(null)
    setFile(selectedFile)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  async function handleDownloadTemplate() {
    try {
      setDownloadingTemplate(true)
      await downloadCsvTemplate(token)
    } catch (err) {
      setError(err.message || 'Failed to download CSV template')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file to import')
      return
    }

    try {
      setLoading(true)
      setError('')
      setResult(null)
      const res = await importProductsCsv(file, updateExisting, token)
      setResult(res.data)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to import CSV')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="csv-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="csv-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="csv-modal-header">
          <div className="csv-header-left">
            <div className="csv-header-icon-badge">
              <FiUploadCloud />
            </div>
            <div>
              <h2 className="csv-modal-title">Bulk Import Products</h2>
              <p className="csv-modal-subtitle">Upload your catalog spreadsheet to add or update items</p>
            </div>
          </div>
          <button type="button" className="csv-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="csv-modal-body">
          {/* Quick Guide & Template Download */}
          <div className="csv-info-card">
            <div className="csv-info-header">
              <span className="csv-info-title">
                <FiFileText /> Supported CSV Schema
              </span>
              <button
                type="button"
                className="csv-template-download-btn"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
              >
                <FiDownload />
                {downloadingTemplate ? 'Downloading…' : 'Sample CSV Template'}
              </button>
            </div>
            <div className="csv-column-pills">
              {SUPPORTED_COLUMNS.map((col) => (
                <span
                  key={col.name}
                  className={`csv-col-pill ${col.required ? 'required' : ''}`}
                  title={col.required ? 'Required field' : 'Optional field'}
                >
                  {col.name}
                  {col.required && ' *'}
                </span>
              ))}
            </div>
          </div>

          {/* Drag & Drop Upload Zone or Selected File Card */}
          {!file ? (
            <div
              className={`csv-dropzone ${isDragOver ? 'is-dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="csv-dropzone-icon-wrap">
                <FiUploadCloud />
              </div>
              <div>
                <div className="csv-dropzone-title">
                  Drop your CSV file here, or <span>browse files</span>
                </div>
                <div className="csv-dropzone-hint">Supported format: .csv (Max 10MB)</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="csv-file-selected-card">
              <div className="csv-file-info-left">
                <div className="csv-file-icon-box">
                  <FiFileText />
                </div>
                <div className="csv-file-details">
                  <span className="csv-file-name" title={file.name}>
                    {file.name}
                  </span>
                  <div className="csv-file-meta">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span className="csv-badge-ready">Ready to Import</span>
                  </div>
                </div>
              </div>
              {!result && !loading && (
                <button
                  type="button"
                  className="csv-remove-file-btn"
                  onClick={handleReset}
                  title="Remove and choose another file"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          )}

          {/* Option: Update existing products */}
          {!result && (
            <label className="csv-option-card">
              <div className="csv-switch-wrap">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                />
                <span className="csv-switch-slider" />
              </div>
              <div className="csv-option-text">
                <span className="csv-option-title">Auto-sync existing products</span>
                <span className="csv-option-desc">
                  Matches by product name or slug to update prices, stock, and details in-place instead of creating duplicates.
                </span>
              </div>
            </label>
          )}

          {/* Error Banner */}
          {error && (
            <div className="csv-alert-error">
              <FiAlertCircle style={{ flexShrink: 0, fontSize: '1.1rem' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result Dashboard */}
          {result && (
            <div className="csv-result-container">
              <div className="csv-result-header">
                <FiCheckCircle style={{ color: '#059669', fontSize: '1.2rem' }} />
                <span>Import Processed Successfully</span>
              </div>

              <div className="csv-stats-grid">
                <div className="csv-stat-card">
                  <span className="csv-stat-number">{result.totalRows}</span>
                  <span className="csv-stat-label">Total Rows</span>
                </div>
                <div className="csv-stat-card created">
                  <span className="csv-stat-number">{result.createdCount}</span>
                  <span className="csv-stat-label">Created</span>
                </div>
                <div className="csv-stat-card updated">
                  <span className="csv-stat-number">{result.updatedCount}</span>
                  <span className="csv-stat-label">Updated</span>
                </div>
                <div className={`csv-stat-card ${result.failedCount > 0 ? 'failed' : ''}`}>
                  <span className="csv-stat-number">{result.failedCount}</span>
                  <span className="csv-stat-label">Failed</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="csv-errors-box">
                  <div className="csv-errors-title">
                    ⚠️ {result.errors.length} row{result.errors.length > 1 ? 's' : ''} skipped with errors:
                  </div>
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="csv-error-row">
                      <strong>Row {err.row} ({err.name}):</strong> {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="csv-modal-footer">
            <button type="button" className="csv-btn-secondary" onClick={onClose}>
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result ? (
              <button
                type="submit"
                className="csv-btn-primary"
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                    Importing Catalog…
                  </>
                ) : (
                  <>
                    <FiUploadCloud />
                    Start Import
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="csv-btn-secondary"
                onClick={handleReset}
                style={{ background: '#f8fafc' }}
              >
                Import Another File
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
