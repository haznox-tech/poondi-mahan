import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  SITE_FULL_NAME,
  SITE_URL,
  ORGANIZATION_ADDRESS,
  ORGANIZATION_PHONE,
  ORGANIZATION_EMAIL,
  DEFAULT_DESCRIPTION,
} from '../data/site.js';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_FULL_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/poondimahan-logo.png`,
    width: '512',
    height: '512',
  },
  image: `${SITE_URL}/images/seo/og-default.webp`,
  description: DEFAULT_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    streetAddress: ORGANIZATION_ADDRESS.streetAddress,
    addressLocality: ORGANIZATION_ADDRESS.addressLocality,
    addressRegion: ORGANIZATION_ADDRESS.addressRegion,
    postalCode: ORGANIZATION_ADDRESS.postalCode,
    addressCountry: ORGANIZATION_ADDRESS.addressCountry,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: ORGANIZATION_PHONE[0],
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['Tamil', 'English'],
  },
  email: ORGANIZATION_EMAIL,
};

const placeOfWorshipSchema = {
  '@context': 'https://schema.org',
  '@type': 'HinduTemple',
  '@id': `${SITE_URL}/#ashramam`,
  name: 'Sri Poondi Mahan Attru Swamy Ashramam',
  alternateName: 'Poondi Mahan Ashramam',
  url: SITE_URL,
  description: 'Sacred Ashramam and Adhistanam of Sri Poondi Mahan located in Poondi, Kalasapakkam.',
  image: `${SITE_URL}/images/seo/og-default.webp`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: ORGANIZATION_ADDRESS.streetAddress,
    addressLocality: ORGANIZATION_ADDRESS.addressLocality,
    addressRegion: ORGANIZATION_ADDRESS.addressRegion,
    postalCode: ORGANIZATION_ADDRESS.postalCode,
    addressCountry: ORGANIZATION_ADDRESS.addressCountry,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 12.4332,
    longitude: 79.1171,
  },
  telephone: ORGANIZATION_PHONE[0],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '06:00',
      closes: '20:30',
    },
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_FULL_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en-IN',
};

export function OrganizationSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(placeOfWorshipSchema)}</script>
    </Helmet>
  );
}

export function PlaceOfWorshipSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(placeOfWorshipSchema)}</script>
    </Helmet>
  );
}

export function WebSiteSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
    </Helmet>
  );
}

export function BreadcrumbSchema({ items }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function WebPageSchema({ name, description, url, about }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${SITE_URL}${url}`,
    isPartOf: { '@type': 'WebSite', url: SITE_URL },
    ...(about && { about: { '@type': 'Thing', name: about } }),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function ArticleSchema({ headline, description, image, datePublished, dateModified, author }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: image ? `${SITE_URL}${image}` : `${SITE_URL}/images/seo/og-default.webp`,
    datePublished: datePublished || '2024-01-01',
    dateModified: dateModified || new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: author || SITE_FULL_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_FULL_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/poondimahan-logo.png`,
      },
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function DonateActionSchema({ name, description, url }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: name || 'Support Annadanam Seva at Sri Poondi Mahan Ashramam',
    description: description || 'Offer donations for daily Annadanam and charitable seva at Sri Poondi Mahan Ashramam.',
    recipient: {
      '@type': 'Organization',
      name: SITE_FULL_NAME,
      url: SITE_URL,
    },
    actionStatus: 'PotentialActionStatus',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}${url || '/donation'}`,
      inLanguage: 'en',
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function FAQSchema({ questions }) {
  if (!questions || !questions.length) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function BookListSchema({ books }) {
  if (!books || !books.length) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Sri Poondi Mahan Spiritual Books & Publications',
    itemListElement: books.map((b, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Book',
        name: b.title,
        description: b.desc || b.title,
        inLanguage: b.language || 'ta',
        url: `${SITE_URL}/downloads`,
      },
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
