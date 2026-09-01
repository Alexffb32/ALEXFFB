import { siteConfig } from "@/lib/site";

export default function JsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Alex Bento",
    alternateName: "Alexandre Bento",
    url: siteConfig.url,
    email: `mailto:${siteConfig.contactEmail}`,
    jobTitle: "Vice-President, Selfmade Association",
    nationality: "Portuguese",
    sameAs: siteConfig.sameAs,
    worksFor: [
      {
        "@type": "Organization",
        name: "Selfmade Association",
      },
      {
        "@type": "Organization",
        name: "Aeternus Progressus",
      },
    ],
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.png`,
    email: siteConfig.contactEmail,
    founder: {
      "@type": "Person",
      name: "Alex Bento",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
