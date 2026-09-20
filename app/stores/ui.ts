export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: 'dark' as 'dark' | 'light',
    toasts: [] as { id: number; message: string }[],
    installEvent: null as null | { prompt: () => Promise<void> },
  }),
  persist: true,
  actions: {
    applyTheme() {
      if (!import.meta.client) return
      document.documentElement.classList.toggle('light', this.theme === 'light')
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      this.applyTheme()
    },
    pushToast(message: string) {
      const id = Date.now()
      this.toasts.push({ id, message })
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id)
      }, 3500)
    },
  },
})
