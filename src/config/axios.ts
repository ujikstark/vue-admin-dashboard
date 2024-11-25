// src/config/axios.ts
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    const auth = JSON.parse(localStorage.getItem('auth') || 'null')

    if (token && auth?.isAuthenticated && auth?.exp && Date.now() < auth.exp) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      const authStore = useAuthStore()
      authStore.logout()

      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' })
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      authStore.logout()
      if (router.currentRoute.value.name !== 'login') {
        router.push({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
      }
    }

    return Promise.reject(error)
  }
)

export default instance