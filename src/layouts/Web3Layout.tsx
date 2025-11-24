import { Outlet } from "react-router-dom";
import { Web3Navbar } from "@/components/web3/Web3Navbar";
import { Web3Footer } from "@/components/web3/Web3Footer";

export default function Web3Layout() {
  return (
    <div className="min-h-screen web3-dark bg-[hsl(var(--web3-bg-dark))]">
      <Web3Navbar />
      <main>
        <Outlet />
      </main>
      <Web3Footer />
    </div>
  );
}
