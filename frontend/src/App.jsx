import { BrowserRouter, Routes, Route } from 'react-router-dom'

import LoginPage from "./pages/LoginPage";
import CreateOrganisationPage from './pages/CreateOrganisationPage';
import DashboardPage from "./pages/DashboardPage.jsx";


export default function App() {
  return (
    <div>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}>
        <Routes>
          <Route index element={<CreateOrganisationPage />} />
          <Route path="/setup" element={<CreateOrganisationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}