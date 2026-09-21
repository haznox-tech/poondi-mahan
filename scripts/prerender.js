import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Import data
import {
  SITE_NAME,
  SITE_FULL_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_KEYWORDS,
  ORGANIZATION_ADDRESS,
  ORGANIZATION_PHONE,
  ORGANIZATION_EMAIL,
} from '../src/data/site.js';

import { pageSEO } from '../src/data/seo.js';
import { books } from '../src/data/books.js';

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

function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

function getWebPageSchema(name, description, url, about) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${SITE_URL}${url}`,
    isPartOf: { '@type': 'WebSite', url: SITE_URL },
    ...(about && { about: { '@type': 'Thing', name: about } }),
  };
}

const routes = [
  {
    path: '/',
    key: 'home',
    schemas: [organizationSchema, websiteSchema, placeOfWorshipSchema],
  },
  {
    path: '/about',
    key: 'about',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]),
      getWebPageSchema(pageSEO.about.title, pageSEO.about.description, '/about', 'Sri Poondi Mahan'),
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: pageSEO.about.title,
        description: pageSEO.about.description,
        image: `${SITE_URL}/images/swami/poondi-mahan-portrait.webp`,
        datePublished: '2024-01-01',
        dateModified: new Date().toISOString().split('T')[0],
        author: { '@type': 'Organization', name: SITE_FULL_NAME, url: SITE_URL },
        publisher: { '@type': 'Organization', name: SITE_FULL_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/poondimahan-logo.png` } },
      },
    ],
  },
  {
    path: '/trustees',
    key: 'trustees',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Trustees', path: '/trustees' }]),
      getWebPageSchema(pageSEO.trustees.title, pageSEO.trustees.description, '/trustees'),
    ],
  },
  {
    path: '/gallery',
    key: 'gallery',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }]),
      getWebPageSchema(pageSEO.gallery.title, pageSEO.gallery.description, '/gallery'),
    ],
  },
  {
    path: '/donation',
    key: 'donation',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Donation', path: '/donation' }]),
      getWebPageSchema(pageSEO.donation.title, pageSEO.donation.description, '/donation'),
      {
        '@context': 'https://schema.org',
        '@type': 'DonateAction',
        name: 'Support Annadanam Seva at Sri Poondi Mahan Ashramam',
        description: pageSEO.donation.description,
        recipient: { '@type': 'Organization', name: SITE_FULL_NAME, url: SITE_URL },
        actionStatus: 'PotentialActionStatus',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/donation`,
          inLanguage: 'en',
          actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
        },
      },
    ],
  },
  {
    path: '/downloads',
    key: 'downloads',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Downloads', path: '/downloads' }]),
      getWebPageSchema(pageSEO.downloads.title, pageSEO.downloads.description, '/downloads'),
      {
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
      },
    ],
  },
  {
    path: '/contact',
    key: 'contact',
    schemas: [
      getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]),
      getWebPageSchema(pageSEO.contact.title, pageSEO.contact.description, '/contact'),
      placeOfWorshipSchema,
    ],
  },
];

export default async function prerender() {
  console.log('\n🚀 Starting SEO Pre-rendering & Static Metadata Generation...');

  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found! Run "vite build" first.');
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf-8');

  for (const route of routes) {
    const seo = pageSEO[route.key] || pageSEO.home;
    const metaTitle = seo.title;
    const metaDescription = seo.description;
    const metaKeywords = seo.keywords || DEFAULT_KEYWORDS;
    const metaCanonical = seo.canonical || `${SITE_URL}${route.path}`;
    const metaImage = seo.image || DEFAULT_OG_IMAGE;
    const metaImageAlt = seo.imageAlt || DEFAULT_OG_IMAGE_ALT;
    const metaRobots = seo.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const metaType = seo.type || 'website';

    let html = baseHtml;

    // Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${metaTitle}</title>`);

    // Replace meta description
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${metaDescription}" />`);

    // Replace keywords
    html = html.replace(/<meta\s+name=["']keywords["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="keywords" content="${metaKeywords}" />`);

    // Replace canonical
    html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${metaCanonical}" />`);

    // Replace robots
    html = html.replace(/<meta\s+name=["']robots["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="robots" content="${metaRobots}" />`);

    // Replace og:title & og:description & og:url & og:image
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${metaTitle}" />`);
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${metaDescription}" />`);
    html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${metaCanonical}" />`);
    html = html.replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${metaImage}" />`);
    html = html.replace(/<meta\s+property=["']og:image:alt["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image:alt" content="${metaImageAlt}" />`);
    html = html.replace(/<meta\s+property=["']og:type["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:type" content="${metaType}" />`);

    // Replace twitter tags
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${metaTitle}" />`);
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${metaDescription}" />`);
    html = html.replace(/<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:image" content="${metaImage}" />`);

    // Inject JSON-LD Schema scripts
    const schemaTags = (route.schemas || [])
      .map((schema) => `\n    <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>`)
      .join('');

    html = html.replace('</head>', `${schemaTags}\n  </head>`);

    // Determine target file
    let targetFile;
    if (route.path === '/') {
      targetFile = path.join(distDir, 'index.html');
    } else {
      const targetDir = path.join(distDir, route.path.replace(/^\//, ''));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      targetFile = path.join(targetDir, 'index.html');
    }

    fs.writeFileSync(targetFile, html, 'utf-8');
    console.log(`✅ Pre-rendered: ${route.path} -> ${path.relative(rootDir, targetFile)}`);
  }

  // Also create 404.html
  const notFoundSeo = pageSEO.notFound;
  let notFoundHtml = baseHtml
    .replace(/<title>.*?<\/title>/i, `<title>${notFoundSeo.title}</title>`)
    .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${notFoundSeo.description}" />`)
    .replace(/<meta\s+name=["']robots["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="robots" content="noindex, nofollow" />`);
  fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');
  console.log('✅ Generated: 404.html');

  console.log('✨ 100% SEO Pre-rendering & Structured Data Completed Successfully!\n');
}

if (process.argv[1] && process.argv[1].endsWith('prerender.js')) {
  prerender();
}
