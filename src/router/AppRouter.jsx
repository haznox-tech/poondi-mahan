import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../admin/ProtectedRoute.jsx';
import NotFound from '../pages/NotFound.jsx';
import Home from '../pages/Home.jsx';
import About from '../pages/About.jsx';
import Trustees from '../pages/Trustees.jsx';
import Gallery from '../pages/Gallery.jsx';
import Donation from '../pages/Donation.jsx';
import Downloads from '../pages/Downloads.jsx';
import Contact from '../pages/Contact.jsx';
import AdminLogin from '../pages/admin/AdminLogin.jsx';
import AdminGallery from '../pages/admin/AdminGallery.jsx';
import AdminVideos from '../pages/admin/AdminVideos.jsx';
import AdminHomeFeatured from '../pages/admin/AdminHomeFeatured.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'trustees',
        element: <Trustees />,
      },
      {
        path: 'gallery',
        element: <Gallery />,
      },
      {
        path: 'donation',
        element: <Donation />,
      },
      {
        path: 'downloads',
        element: <Downloads />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/gallery" replace />,
      },
      {
        path: 'gallery',
        element: <AdminGallery />,
      },
      {
        path: 'videos',
        element: <AdminVideos />,
      },
      {
        path: 'featured',
        element: <AdminHomeFeatured />,
      },
      {
        path: 'trash',
        element: <AdminGallery />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

