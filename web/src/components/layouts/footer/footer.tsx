"use client";

import { Instagram } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
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
    <footer className="border-t border-mirai-border-muted bg-white text-mirai-text">
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
      <Link
        href={routes.home()}
        aria-label="みらい議会＠田川市 トップページ"
        className="flex items-center gap-2"
      >
        <Image
          src="/img/logo.svg"
          alt=""
          width={42}
          height={36}
          className="shrink-0"
        />
        <Image
          src="/img/service-logo.svg"
          alt="みらい議会＠田川市"
          width={136}
          height={25}
          className="h-auto w-[136px]"
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
      flex flex-row flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[14px] font-semibold text-mirai-text-secondary
      "
      >
        {primaryLinks.map((link) => (
          <li key={link.label} className="whitespace-nowrap">
            <Link
              href={link.href as Route}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
    <div className="flex flex-col items-center text-[12px] font-semibold text-mirai-text-secondary mb-5">
      <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {policyLinks.map((policy, index) => (
          <li key={policy.label} className="flex items-center gap-2">
            <Link
              href={policy.href as Route}
              target={policy.external ? "_blank" : undefined}
              rel={policy.external ? "noreferrer" : undefined}
              className="whitespace-nowrap transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        className="text-mirai-text-secondary transition-colors hover:text-primary"
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
      <p className="mt-1">
        本サイトのソースコードは AGPL-3.0 に基づき
        <a
          href={EXTERNAL_LINKS.SOURCE_CODE}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          GitHub
        </a>
        で公開しています。
      </p>
    </div>
  );
}

function FooterCopyright() {
  return (
    <div className="text-center text-sm font-medium text-mirai-text-secondary">
      © 2026 田川市政ラボ All rights Reserved
    </div>
  );
}
