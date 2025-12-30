import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '10px 12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          maxWidth: '360px',
        },
        success: {
          iconTheme: {
            primary: 'var(--secondary)',
            secondary: 'var(--bg-primary)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--bg-primary)',
          },
        },
      }}
    />
  )
}
