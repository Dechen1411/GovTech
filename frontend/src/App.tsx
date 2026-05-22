import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { pageLoaders } from "@/lib/routePreload";
import Index from "./pages/Index.tsx";

const AdminDashboard = lazy(pageLoaders.adminDashboard);
const UserDashboard = lazy(pageLoaders.userDashboard);
const NotFound = lazy(pageLoaders.notFound);

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-4 text-sm font-semibold uppercase tracking-wide text-primary">
    Opening official service workspace...
  </div>
);

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
