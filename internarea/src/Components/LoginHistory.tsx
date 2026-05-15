import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { selectuser } from "@/Feature/Userslice"
import { Monitor } from "lucide-react"
import axios from "axios"

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function LoginHistory() {
  var user = useSelector(selectuser)
  var [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      axios.get(API + "/api/auth/login-history/" + user.uid).then((res) => {
        setHistory(res.data)
      }).catch(() => {})
    }
  }, [user])

  if (!user || history.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="text-blue-600" size={18} />
        <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Browser</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">OS</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Device</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">IP</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any, i: number) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">{h.browser}</td>
                <td className="px-4 py-2 text-gray-700">{h.os}</td>
                <td className="px-4 py-2 text-gray-700">{h.device}</td>
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{h.ip}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{new Date(h.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
