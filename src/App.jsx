import { HelmetProvider } from 'react-helmet-async';
import AppRouter from './router/AppRouter.jsx';
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx';

export default function App() {
  return (
    <HelmetProvider>
      <AdminAuthProvider>
        <AppRouter />
      </AdminAuthProvider>
    </HelmetProvider>
  );
}

