import type { ReactNode } from "react";
import { Container } from "@/components/layouts/container";
import { cn } from "@/lib/utils";

interface LegalPageLayoutProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  className,
  children,
}: LegalPageLayoutProps) {
  return (
    <section className={cn("py-12", className)}>
      <Container className="space-y-10">
        <header className="space-y-3 border-b border-mirai-border-muted pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-mirai-text sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-base leading-relaxed text-mirai-text-note">
              {description}
            </p>
          ) : null}
        </header>

        <div className="space-y-8 text-mirai-text-note">{children}</div>
      </Container>
    </section>
  );
}

interface LegalSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function LegalSectionTitle({
  children,
  className,
}: LegalSectionTitleProps) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold tracking-tight text-mirai-text sm:text-xl",
        className
      )}
    >
      {children}
    </h2>
  );
}

interface LegalSubSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function LegalSubSectionTitle({
  children,
  className,
}: LegalSubSectionTitleProps) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight text-mirai-text",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface LegalParagraphProps {
  children: ReactNode;
  className?: string;
}

export function LegalParagraph({ children, className }: LegalParagraphProps) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-mirai-text-note sm:text-base",
        className
      )}
    >
      {children}
    </p>
  );
}

type LegalListItem = string | { id: string; content: ReactNode };

interface LegalListProps {
  items: LegalListItem[];
  ordered?: boolean;
  className?: string;
}

export function LegalList({ items, ordered, className }: LegalListProps) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag
      className={cn(
        "space-y-1 text-sm leading-relaxed text-mirai-text-note sm:text-base",
        ordered ? "list-decimal pl-5" : "list-disc pl-5",
        className
      )}
    >
      {items.map((item) => {
        const key = typeof item === "string" ? item : item.id;
        const content = typeof item === "string" ? item : item.content;

        return <li key={key}>{content}</li>;
      })}
    </ListTag>
  );
}
