import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  SITE_FULL_NAME,
  SITE_URL,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  GEO_REGION,
  GEO_PLACENAME,
  GEO_POSITION,
  ICBM,
} from '../data/site.js';

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  image,
  imageAlt,
  type = 'website',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  locale = DEFAULT_LOCALE,
  author = SITE_FULL_NAME,
}) {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language?.startsWith('ta') ? 'ta' : 'en';

  const metaTitle = title || DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaKeywords = keywords || DEFAULT_KEYWORDS;
  const metaImage = image || DEFAULT_OG_IMAGE;
  const metaImageAlt = imageAlt || DEFAULT_OG_IMAGE_ALT;
  const metaUrl = canonical || SITE_URL;

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="bingbot" content={robots} />
      <meta name="rating" content="general" />
      <meta name="revisit-after" content="3 days" />
      <meta name="format-detection" content="telephone=no" />

      {canonical && <link rel="canonical" href={metaUrl} />}
      {canonical && <link rel="alternate" hrefLang="en" href={metaUrl} />}
      {canonical && <link rel="alternate" hrefLang="ta" href={metaUrl} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={metaUrl} />}

      {/* Geo / Local SEO */}
      <meta name="geo.region" content={GEO_REGION} />
      <meta name="geo.placename" content={GEO_PLACENAME} />
      <meta name="geo.position" content={GEO_POSITION} />
      <meta name="ICBM" content={ICBM} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:secure_url" content={metaImage} />
      <meta property="og:image:alt" content={metaImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/webp" />
      <meta property="og:site_name" content={SITE_FULL_NAME} />
      <meta property="og:locale" content={locale} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={metaImageAlt} />

      {/* Theme & Mobile Browser */}
      <meta name="theme-color" content="#173F35" />
      <meta name="msapplication-TileColor" content="#173F35" />
    </Helmet>
  );
}
