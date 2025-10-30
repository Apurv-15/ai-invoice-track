import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/config";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Loader from "./Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && requireAdmin) {
        await checkAdminRole(firebaseUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [requireAdmin]);

  const checkAdminRole = async (userId: string) => {
    try {
      const roleDoc = await getDoc(doc(db, 'user_roles', userId));
      setIsAdmin(roleDoc.exists() && roleDoc.data()?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader onLoadComplete={() => {}} />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
