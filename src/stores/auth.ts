// src/stores/auth.ts
import { defineStore } from 'pinia'
import { User } from '../pages/users/types'
import axios from 'axios'
// import axios from '../config/axios';
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('authToken') || '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(credentials: { email: string; password: string }) {
      try {
        const response = await axios.post('http://localhost/api/v1/login', credentials)
        console.log(response)
        this.token = response.data.access_token

        localStorage.setItem('authToken', this.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed')
      }
    },

    async fetchUser() {
      try {
        const response = await axios.get('/api/v1/me')
        this.user = response.data
      } catch (error) {
        this.logout()
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('authToken')
      delete axios.defaults.headers.common['Authorization']
    },
  },
})
