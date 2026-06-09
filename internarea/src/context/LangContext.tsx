import { createContext, useContext, useState, useEffect } from "react"
import translations from "../utils/translations.json"

var LangContext = createContext<any>(null)

var LANGS = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "zh", label: "中文" },
  { id: "fr", label: "Français" },
]

export function LangProvider({ children }: any) {
  var [lang, setLang] = useState("en")

  useEffect(() => {
    var saved = localStorage.getItem("ia_lang")
    if (saved) setLang(saved)
  }, [])

  function switchLang(newLang: string) {
    setLang(newLang)
    localStorage.setItem("ia_lang", newLang)
  }

  function t(key: string) {
    var dict = (translations as any)[lang] || (translations as any)["en"]
    return dict[key] || key
  }

  return (
    <LangContext.Provider value={{ lang, switchLang, t, LANGS }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
