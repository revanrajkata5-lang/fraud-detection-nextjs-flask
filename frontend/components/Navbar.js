"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/#abstract", label: "About" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/detect", label: "Detect Fraud" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="MCET logo" width={36} height={36} />
          <span>FraudGuard</span>
        </Link>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        <nav className={open ? "links open" : "links"}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={path === l.href ? "active" : ""}>{l.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
