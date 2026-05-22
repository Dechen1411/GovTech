import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Index from "./pages/Index.tsx";
import UserDashboard from "./pages/UserDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/admin-login" element={<Navigate to="/" replace />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
