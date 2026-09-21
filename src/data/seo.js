import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_KEYWORDS,
} from './site.js';

export const pageSEO = {
  home: {
    title: `${SITE_NAME} | Attru Swamy Ashramam Committee, Kalasapakkam`,
    description:
      'Official website of Sri Poondi Mahan Attru Swamy Ashramam Committee in Poondi, Kalasapakkam. Explore his spiritual legacy, Annadanam Seva, books, trustees and visit information.',
    keywords:
      'Sri Poondi Mahan, Poondi Mahan, Attru Swamy, Attru Swamy Ashramam, Poondi Swami, Kalasapakkam, Thiruvannamalai, Annadanam Seva, Poondi Mahan history, spiritual legacy, Poondi temple',
    canonical: `${SITE_URL}/`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: DEFAULT_OG_IMAGE_ALT,
  },
  about: {
    title: `About ${SITE_NAME} | Life, Miracles & Spiritual Legacy`,
    description:
      'Learn about the divine life, spiritual tapas, sacred sayings, and enduring legacy of Sri Poondi Mahan at Attru Swamy Ashramam, Kalasapakkam, Tamil Nadu.',
    keywords:
      'Sri Poondi Mahan biography, Poondi Mahan life history, Attru Swamy life, Poondi Mahan miracles, Kalasapakkam Mahan, Tamil Nadu saints, Poondi sadhana',
    canonical: `${SITE_URL}/about`,
    type: 'article',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Sri Poondi Mahan — spiritual life and legacy',
  },
  trustees: {
    title: `${SITE_NAME} Trustees | Ashramam Committee Governance`,
    description:
      'Meet the dedicated trustees and committee members managing the spiritual activities, Annadanam Seva, and development of Sri Poondi Mahan Attru Swamy Ashramam.',
    keywords:
      'Sri Poondi Mahan trustees, Poondi ashramam committee, Attru Swamy trustees, ashramam administration, Kalasapakkam ashramam management',
    canonical: `${SITE_URL}/trustees`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Sri Poondi Mahan trustees and committee members',
  },
  gallery: {
    title: `${SITE_NAME} Gallery | Rare Photographs, Sacred Videos & Darshan`,
    description:
      'Explore rare historical photographs, sacred darshan videos, and spiritual satsang shorts of Sri Poondi Mahan and Attru Swamy Ashramam, Kalasapakkam.',
    keywords:
      'Sri Poondi Mahan photos, Poondi Mahan videos, Poondi swami gallery, Attru Swamy photos and videos, Kalasapakkam ashramam sacred shorts, Poondi darshan video',
    canonical: `${SITE_URL}/gallery`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Sri Poondi Mahan photograph and video gallery',
  },
  donation: {
    title: `Annadanam Seva & Donations | ${SITE_NAME} Official Ashramam`,
    description:
      'Support daily Annadanam Seva and sacred activities at Sri Poondi Mahan Attru Swamy Ashramam. Donate via UPI, QR code, or direct bank transfer.',
    keywords:
      'Sri Poondi Mahan donation, Annadanam donation, Poondi Mahan Annadanam Seva, support Poondi ashramam, UPI donation Poondi ashramam, Kalasapakkam temple donation',
    canonical: `${SITE_URL}/donation`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Support Annadanam Seva at Sri Poondi Mahan Ashramam',
  },
  downloads: {
    title: `Spiritual Books & Publications | ${SITE_NAME} Downloads`,
    description:
      'Download and read official spiritual books, biographies, songs, and publications in Tamil & English about Sri Poondi Mahan and his divine teachings.',
    keywords:
      'Sri Poondi Mahan books PDF, Poondi Mahan publications, Attru Swamy books, Poondi Mahan history Tamil book, spiritual books download',
    canonical: `${SITE_URL}/downloads`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Sri Poondi Mahan books and publications downloads',
  },
  contact: {
    title: `Contact ${SITE_NAME} | Ashramam Location, Timings & Visit Guide`,
    description:
      'Official contact details, address, phone numbers, map location, visiting hours, and travel directions for Sri Poondi Mahan Attru Swamy Ashramam, Kalasapakkam.',
    keywords:
      'Contact Sri Poondi Mahan ashramam, Poondi ashramam phone number, Kalasapakkam address, Poondi ashramam timings, how to reach Poondi Mahan ashramam',
    canonical: `${SITE_URL}/contact`,
    type: 'website',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Contact and location map of Sri Poondi Mahan Ashramam',
  },
  notFound: {
    title: `Page Not Found (404) | ${SITE_NAME}`,
    description: 'The requested page could not be found. Please return to the homepage.',
    keywords: '404 not found',
    canonical: null,
    type: 'website',
    robots: 'noindex, nofollow',
    image: DEFAULT_OG_IMAGE,
    imageAlt: DEFAULT_OG_IMAGE_ALT,
  },
};

export { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, DEFAULT_KEYWORDS };

