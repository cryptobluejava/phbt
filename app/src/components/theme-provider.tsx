"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("phbt_theme") as Theme | null
        if (saved) {
            setTheme(saved)
        }
    }, [])

    useEffect(() => {
        if (!mounted) return
        
        const root = document.documentElement
        if (theme === "light") {
            root.classList.add("light")
            root.classList.remove("dark")
        } else {
            root.classList.add("dark")
            root.classList.remove("light")
        }
        localStorage.setItem("phbt_theme", theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark")
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}

