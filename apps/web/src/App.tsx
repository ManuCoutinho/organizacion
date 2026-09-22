import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Users } from '@/pages/Users'
import { Profile } from '@/pages/Profile'
import { NotFound } from '@/pages/NotFound'

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path='/' element={<Navigate to='/usuarios' replace />} />
            <Route element={<ProtectedRoute roles={['ADMIN', 'OPERATOR']} />}>
              <Route path='/usuarios' element={<Users />} />
            </Route>
            <Route path='/perfil' element={<Profile />} />
          </Route>
        </Route>

        <Route path='*' element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)
