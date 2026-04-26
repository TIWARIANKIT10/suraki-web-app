"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/custom/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Show Navbar only on home page
  if (pathname == "/camara") return null;

  return <Navbar />;
}