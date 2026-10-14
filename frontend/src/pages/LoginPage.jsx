
import { LoginForm } from "@/components/login-form"
import { useTheme } from "@/context/ThemeContext"
import { Sun, Moon } from "lucide-react"

export default function LoginPage() {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-slate-50 p-6 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle light and dark mode"
        className="absolute right-5 top-5 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}
