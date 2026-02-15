import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LoginPage from "./pages/LoginPage";
import CreateOrganisationPage from './pages/CreateOrganisationPage';
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from './pages/EmployeesPage';

import Layout from './components/Layout';   // ← Fixed import
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route path="/" element={<CreateOrganisationPage />} />
        <Route path="/setup" element={<CreateOrganisationPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}