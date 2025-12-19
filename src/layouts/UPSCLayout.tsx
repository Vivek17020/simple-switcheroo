import { Outlet, useLocation } from "react-router-dom";
import { UPSCNavbar } from "@/components/upsc/UPSCNavbar";
import { UPSCFooter } from "@/components/upsc/UPSCFooter";

const UPSCLayout = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <UPSCNavbar />
      <main className="flex-1" key={location.pathname}>
        <Outlet />
      </main>
      <UPSCFooter />
    </div>
  );
};

export default UPSCLayout;
