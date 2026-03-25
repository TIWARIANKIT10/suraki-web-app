"use client"

import { HomeIcon, HelpCircle, Info, CircleUser } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const Navbar = () => {
  const pathname = usePathname()

  const baseStyle = "flex flex-col items-center transition-colors"
  const inactiveStyle = "text-white"
  const activeStyle = "text-black"

  const isHome = pathname === "/"
  const isHelp = pathname === "/help"
  const isAbout = pathname === "/about"
  const isProfile = pathname === "/profile"

  return (
    <div className="fixed bottom-0 left-0 w-full bg-green-700 shadow-md flex justify-around py-3">
      <Link href="/" className={`${baseStyle} ${isHome ? activeStyle : inactiveStyle}`}>
        <HomeIcon
          className="size-5"
          fill={isHome ? "white" : "none"}
          stroke="currentColor"
          strokeWidth={isHome ? 2.5 : 2}
        />
        <span className="text-xs">Home</span>
      </Link>

      <Link href="/help" className={`${baseStyle} ${isHelp ? activeStyle : inactiveStyle}`}>
        <HelpCircle
          className="size-5"
          fill={isHelp ? "white" : "none"}
          stroke="currentColor"
          strokeWidth={isHelp ? 2.5 : 2}
        />
        <span className="text-xs">Help</span>
      </Link>

      <Link href="/about" className={`${baseStyle} ${isAbout ? activeStyle : inactiveStyle}`}>
        <Info
          className="size-5"
          fill={isAbout ? "white" : "none"}
          stroke="currentColor"
          strokeWidth={isAbout ? 2.5 : 2}
        />
        <span className="text-xs">About</span>
      </Link>

      <Link href="/profile" className={`${baseStyle} ${isProfile ? activeStyle : inactiveStyle}`}>
        <CircleUser 
          className="size-5"
          fill={isProfile ? "white" : "none"}
          stroke="currentColor"
          strokeWidth={isProfile ? 2.5 : 2}
        />
        <span className="text-xs">Profile</span>
      </Link>
    </div>
  )
}

export default Navbar