import { Outlet } from "react-router-dom";
import { UPSCNavbar } from "@/components/upsc/UPSCNavbar";
import { UPSCFooter } from "@/components/upsc/UPSCFooter";

const UPSCLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <UPSCNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <UPSCFooter />
    </div>
  );
};

export default UPSCLayout;
