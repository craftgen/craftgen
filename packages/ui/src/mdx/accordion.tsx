import React, { useMemo } from "react";
import {
  Accordion as FAccordion,
  Accordions as FAccordions,
} from "fumadocs-ui/components/accordion";
import { FAQPage, WithContext } from "schema-dts";

export const Accordion = (props: React.ComponentProps<typeof FAccordion>) => {
  return <FAccordion {...props} />;
};

const getTextFromChildren = (
  children: React.ReactNode | React.ReactNode[] | string,
): string => {
  if (typeof children === "string") return children;
  if (Array.isArray(children))
    return children.map(getTextFromChildren).join("");
  if (children?.props && children?.props?.children)
    return getTextFromChildren(children.props.children);
  return "";
};

export type FAQ = {
  question: string;
  answer: string;
};

export const Accordions = ({
  children,
  isFAQ = false,
}: React.ComponentProps<typeof FAccordions> & { isFAQ?: boolean }) => {
  const faqs = useMemo<FAQ[]>(() => {
    if (!children || !children.length) return [];
    return children.map((child) => {
      return {
        question: child.props.title,
        answer: getTextFromChildren(child.props.children),
      };
    });
  }, [children]);
  const jsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "Frequently asked questions",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <FAccordions type="single">{children}</FAccordions>
      {isFAQ && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
};
