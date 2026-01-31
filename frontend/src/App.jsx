import { BrowserRouter, Routes, Route } from 'react-router-dom'


export default function App() {
  return (
    <div>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}>
        <Routes>
          <Route index element={<AIDENLanding />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}