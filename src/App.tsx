import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ViolationList from '@/pages/ViolationList';
import ViolationDetail from '@/pages/ViolationDetail';
import ViolationForm from '@/pages/ViolationForm';
import ManageUsers from '@/pages/ManageUsers';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gov-blue-200 border-t-gov-blue-700 rounded-full animate-spin" />
      </div>
    );
  }
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/violations" element={<ViolationList />} />
        <Route path="/violations/new" element={<ViolationForm mode="create" />} />
        <Route path="/violations/:id" element={<ViolationDetail />} />
        <Route path="/violations/:id/edit" element={<ViolationForm mode="edit" />} />
        <Route path="/my-reports" element={<ViolationList myReportsOnly />} />
        <Route
          path="/manage-users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
