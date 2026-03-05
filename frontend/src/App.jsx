import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LoginPage from "./pages/LoginPage";
import CreateOrganisationPage from './pages/CreateOrganisationPage';

import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from './pages/EmployeesPage';
import SettingsPage from './pages/SettingsPage';

import Layout from './components/Layout';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<CreateOrganisationPage />} />

        {/* Protected routes with sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}