import type { Metadata } from 'next'
import AuthPage from '@/components/Auth/AuthPage'

export const metadata: Metadata = {
  title: 'Login - Urban Intelligence',
  description: 'Sign in to your Urban Intelligence account',
}

export default function AuthRoute() {
  return <AuthPage />
}