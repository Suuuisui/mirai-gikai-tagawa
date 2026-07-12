"use client";

import { Instagram } from "lucide-react";
import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { isInterviewPage } from "@/lib/page-layout-utils";
import { routes } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { policyLinks, primaryLinks } from "./footer.config";

export function Footer() {
  const pathname = usePathname();

  if (isInterviewPage(pathname)) {
    return null;
  }

  return (
    <footer className="bg-mirai-gradient text-slate-900">
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center px-6 py-14 pb-20 text-center">
        <FooterLogoSection />
        <FooterPrimaryLinks />
        <FooterPolicies />
        <FooterSocialLinks />
        <FooterDisclaimer />
        <FooterCopyright />
      </div>
    </footer>
  );
}

function FooterLogoSection() {
  return (
    <div className="flex flex-col items-center text-center mb-9">
      <Link href={routes.home()} aria-label="みらい議会＠田川市 トップページ">
        <Image
          src="/img/logo.svg"
          alt="みらい議会＠田川市"
          width={150}
          height={128}
          className="h-auto"
        />
      </Link>
    </div>
  );
}

function FooterPrimaryLinks() {
  return (
    <nav aria-label="主要リンク" className="w-full mb-5">
      <ul
        className="
      flex flex-col items-center gap-3 text-[14px] font-semibold text-slate-800
      md:flex-row md:justify-center md:gap-5
      "
      >
        {primaryLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href as Route}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FooterPolicies() {
  return (
    <div className="flex flex-col items-center text-[12px] font-semibold text-slate-800 mb-5">
      <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {policyLinks.map((policy, index) => (
          <li key={policy.label} className="flex items-center gap-2">
            <Link
              href={policy.href as Route}
              target={policy.external ? "_blank" : undefined}
              rel={policy.external ? "noreferrer" : undefined}
              className="transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {policy.label}
            </Link>
            {index < policyLinks.length - 1 ? <span>｜</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterSocialLinks() {
  return (
    <div className="mb-5 flex items-center justify-center">
      <a
        href={SOCIAL_LINKS.instagram.url}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram（田川市政ラボ）"
        className="text-slate-800 transition-colors hover:text-slate-900"
      >
        <Instagram className="size-6" />
      </a>
    </div>
  );
}

function FooterDisclaimer() {
  return (
    <div className="mb-5 max-w-[380px] text-[11px] leading-relaxed text-mirai-text-note">
      <p>
        本サイトは、みらい議会（
        <a
          href={EXTERNAL_LINKS.UPSTREAM_MIRAI_GIKAI}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {EXTERNAL_LINKS.UPSTREAM_MIRAI_GIKAI}
        </a>
        ）を有志団体「田川市政ラボ」が改変・運営する非公式版です。これは政党チームみらいが運営しているものではありません。
      </p>
      <p className="mt-1">運営: 田川市政ラボ</p>
    </div>
  );
}

function FooterCopyright() {
  return (
    <div className="text-center text-sm font-medium text-slate-800">
      © 2026 田川市政ラボ All rights Reserved
    </div>
  );
}
