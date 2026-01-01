import { useContext } from 'react'
import PurchaseModeContext from '../context/PurchaseModeContext.jsx'

export function usePurchaseMode() {
  const ctx = useContext(PurchaseModeContext)
  if (!ctx) {
    throw new Error('usePurchaseMode must be used within PurchaseModeProvider')
  }
  return ctx
}
