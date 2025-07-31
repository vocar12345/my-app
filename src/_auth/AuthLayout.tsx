import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Import our new hook

const AuthLayout = () => {
  const { isAuthenticated } = useAuth(); // Get real auth state from our context

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <>
          <section className="flex flex-1 justify-center items-center flex-col py-10">
            <Outlet />
          </section>
          <img
            src="/assets/images/side-img.png"
            alt="logo"
            className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
          />
        </>
      )}
    </>
  );
};

export default AuthLayout;

