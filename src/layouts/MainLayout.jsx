import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ScrollToTop from '../components/ScrollToTop.jsx';
import PageTransition from '../components/PageTransition.jsx';
import { OrganizationSchema } from '../components/StructuredData.jsx';

export default function MainLayout() {
  return (
    <>
      <OrganizationSchema />
      <ScrollToTop />
      <Navbar />
      <main id="main-content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}
