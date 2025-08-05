import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'

const FIXED_USER = 'atendimento@techmetria.com.br'
const FIXED_PASS = 'Tech#2025'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === FIXED_USER && password === FIXED_PASS) {
      setError('')
      login()
      navigate('/')
    } else {
      setError('Usuário ou senha inválidos.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eaf0ff]">
      <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-3xl overflow-hidden animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center w-1/2 bg-white p-10">
          <img src="/tech.png" alt="Logo" className="w-56 h-56 object-contain" />
        </div>
        {/* Form */}
        <div className="flex flex-col justify-center w-1/2 p-10">
          <h2 className="text-2xl font-bold mb-2 text-[#222]">IOT Monitor</h2>
          <p className="text-sm text-[#6b7280] mb-6">Sistema de Monitoramento</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">E-mail :</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha :</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-2 text-gray-400"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  <span role="img" aria-label="Mostrar senha">👁️</span>
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <button
              type="submit"
              className="w-full py-3 bg-[#009fe3] text-white font-bold rounded-lg shadow hover:bg-[#007bb5] transition"
            >
              Entrar
            </button>
          </form>
          <div className="mt-4 text-right">
            <a href="#" className="text-[#009fe3] text-sm hover:underline">Esqueceu a Senha?</a>
          </div>
        </div>
      </div>
    </div>
  )
}
