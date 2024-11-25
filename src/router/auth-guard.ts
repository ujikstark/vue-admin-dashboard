// src/router/auth-guard.ts
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export const authGuard = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  authStore.initializeAuth()
  if (authStore.isAuthenticated && !authStore.isTokenExpired) {
    next()
  } else {
    authStore.logout()
    next({ name: 'login' })
  }
}

export const guestGuard = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  authStore.initializeAuth()
  if (authStore.isAuthenticated && !authStore.isTokenExpired) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
}