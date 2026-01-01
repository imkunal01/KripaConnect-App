import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 2800,

        style: {
          background: '#ffffff',
          color: '#1f2937', // slate-800
          borderRadius: '14px',
          padding: '12px 14px',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '1.4',
          maxWidth: '340px',
          borderLeft: '5px solid var(--primary)',
          boxShadow:
            '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
        },

        success: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '5px solid #15803d', // subtle green for success
          },
        },

        error: {
          iconTheme: {
            primary: '#b91c1c',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '5px solid #b91c1c',
          },
        },

        loading: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: '#ffffff',
          },
        },
      }}
    />
  )
}
