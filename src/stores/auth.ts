// src/stores/auth.ts
import { defineStore } from 'pinia'
import { User } from '../pages/users/types'
import axios from '../config/axios'
import { addHours } from 'date-fns'

interface AuthState {
    user: User | null;
    auth: {
        isAuthenticated: boolean;
        exp?: number;
    } | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        auth: JSON.parse(localStorage.getItem('auth') || 'null')
    }),

    getters: {
        isAuthenticated: (state) => !!state.auth?.isAuthenticated,
        isTokenExpired: (state) => {
            if (!state.auth?.exp) return true
            return Date.now() > state.auth.exp
        }
    },

    actions: {
        updateAuth(newAuth: { isAuthenticated: boolean; exp?: number }, token?: string) {
            this.auth = newAuth
            localStorage.setItem('auth', JSON.stringify(newAuth))

            // Handle token storage separately
            if (token) {
                localStorage.setItem('access_token', token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            } else {
                localStorage.removeItem('access_token')
                delete axios.defaults.headers.common['Authorization']
            }
        },

        async login(credentials: { email: string; password: string }) {
            const payload = {
                email: credentials.email,
                password: credentials.password
            }

            try {
                const response = await axios.post('http://localhost/api/v1/login', JSON.stringify(payload))

                if (!response.data || !response.data.access_token) {
                    this.updateAuth({ isAuthenticated: false })
                    this.user = null
                    return { auth: { isAuthenticated: false }, user: null }
                }

                const auth = {
                    isAuthenticated: true,
                    exp: addHours(new Date(), 1).getTime()
                }

                // Update auth state and store token
                this.updateAuth(auth, response.data.access_token)

                // Fetch user details
                const user = await this.fetchUser()

                return { auth, user }
            } catch (error) {
                this.updateAuth({ isAuthenticated: false })
                this.user = null
                throw new Error(error.response?.data?.message || 'Login failed')
            }
        },

        async fetchUser() {
            try {
                if (!this.auth?.isAuthenticated || this.isTokenExpired) {
                    throw new Error('Not authenticated')
                }

                const response = await axios.get('/api/v1/me')
                this.user = response.data
                return this.user
            } catch (error) {
                this.logout()
                throw error
            }
        },

        logout() {
            this.updateAuth({ isAuthenticated: false })
            this.user = null
        },

        // Initialize auth state from storage
        initializeAuth() {
            const auth = JSON.parse(localStorage.getItem('auth') || 'null')
            const token = localStorage.getItem('access_token')

            if (auth?.isAuthenticated && token && !this.isTokenExpired) {
                this.auth = auth
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            } else {
                this.logout()
            }
        }
    }
})