import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={12}
      containerStyle={{
        bottom: 80, // ensures it sits above the mobile dock nav pill
      }}
      toastOptions={{
        duration: 2800,

        style: {
          background: 'rgba(17, 24, 39, 0.9)', // almost solid dark gray
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#ffffff',
          borderRadius: '999px', // sleeker pill shape
          padding: '14px 24px',
          fontSize: '14.5px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          lineHeight: '1.4',
          maxWidth: '400px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow:
            '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
        },

        success: {
          iconTheme: {
            primary: '#4ade80', // vibrant green
            secondary: '#111827',
          },
        },

        error: {
          iconTheme: {
            primary: '#f87171', // vibrant red
            secondary: '#111827',
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
