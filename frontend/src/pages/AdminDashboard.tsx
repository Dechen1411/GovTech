import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Admin from "./Admin";
import { getSessionUser } from "@/lib/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "admin") {
      navigate("/admin-login");
    }
  }, [navigate, sessionUser]);

  if (!sessionUser || sessionUser.role !== "admin") {
    return null;
  }

  return <Admin />;
};

export default AdminDashboard;
