import { MapPin, Navigation, ExternalLink, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO.jsx';
import PageHero from '../components/PageHero.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import ContactCard from '../components/ContactCard.jsx';
import PoojaScheduleCard from '../components/PoojaScheduleCard.jsx';
import { BreadcrumbSchema, WebPageSchema, PlaceOfWorshipSchema } from '../components/StructuredData.jsx';
import { pageSEO } from '../data/seo.js';
import { trustees } from '../data/trustees.js';
import { Link } from 'react-router-dom';

export default function Contact() {
  const seo = pageSEO.contact;
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        type={seo.type}
        robots={seo.robots}
      />
      <PlaceOfWorshipSchema />
      <BreadcrumbSchema
        items={[{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]}
      />
      <WebPageSchema name={seo.title} description={seo.description} url="/contact" />

      <PageHero
        title={t('contactPage.heroTitle', 'Contact & Visit')}
        subtitle={t('contactPage.heroSubtitle', 'Find us at Sri Poondi Mahan Attru Swamy Ashramam. All are welcome.')}
        breadcrumbs={[{ label: t('nav.contact', 'Contact') }]}
        bgImage="/images/hero/sri-poondi-mahan-attru-swamy-ashramam-hero.webp"
      />

      <section className="py-16 bg-[#FAF7F0]" aria-labelledby="contact-main-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          
          {/* Main Top Grid: Left = Address & Map, Right = Pooja Schedule Time Table */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
            {/* Left: Address + Live Google Map */}
            <div>
              <SectionHeading
                overline={t('contactPage.visitOverline', 'Visit Us')}
                heading={t('contactPage.visitHeading', 'The Ashramam')}
                id="contact-main-heading"
              />

              {/* Address block */}
              <div className="flex gap-4 mb-8 bg-white border border-[#E8D7B5] rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#173F35] flex items-center justify-center flex-shrink-0 text-[#B78A3B] shadow-sm">
                  <MapPin size={22} aria-hidden="true" />
                </div>
                <address className="not-italic font-sans text-[#77736A] leading-relaxed">
                  <strong className="text-[#173F35] font-serif text-lg font-semibold block mb-1">
                    {t('common.addressTitle', 'Sri Poondi Mahan Attru Swamy Ashramam')}
                  </strong>
                  {t('common.addressLocation', 'Poondi & Post, Kalasapakkam Taluk, Thiruvannamalai District, Tamil Nadu – 606751, India')}
                </address>
              </div>

              {/* Live Interactive Map */}
              <div className="rounded-2xl overflow-hidden border border-[#E8D7B5] bg-white shadow-md shadow-[#173F35]/5">
                <div className="p-4 bg-[#173F35] text-[#FAF7F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-sans font-semibold tracking-wide uppercase text-[#E8D7B5]">
                      {t('contactPage.liveLocation', 'Live Location • Poondi, Tamil Nadu')}
                    </span>
                  </div>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Sri+Poondi+Mahan+Ashramam+Poondi+Kalasapakkam+Tamil+Nadu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Navigation size={13} />
                    <span>{t('contactPage.getDirections', 'Get Directions')}</span>
                  </a>
                </div>

                {/* Embedded Google Map */}
                <div className="relative w-full h-80 sm:h-96 bg-[#F2EBDD]">
                  <iframe
                    src="https://maps.google.com/maps?q=Sri%20Poondi%20Mahan%20Ashramam%2C%20Poondi%2C%20Kalasapakkam%2C%20Tamil%20Nadu%20606751&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    title="Sri Poondi Mahan Ashramam Location Map"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="p-3.5 bg-[#FAF7F0] border-t border-[#E8D7B5]/80 flex items-center justify-between text-xs text-[#77736A] font-sans">
                  <span>Kalasapakkam Taluk, Thiruvannamalai District</span>
                  <a
                    href="https://maps.google.com/?q=Sri+Poondi+Mahan+Ashramam+Poondi+Kalasapakkam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#173F35] font-semibold hover:text-[#B78A3B] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{t('contactPage.openInMaps', 'Open in Maps')}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Pooja Schedule Time Table */}
            <div>
              <SectionHeading
                overline={t('contactPage.poojaScheduleOverline', 'Sacred Timings')}
                heading={t('contactPage.poojaScheduleTitle', 'Pooja Schedule Time')}
              />
              <PoojaScheduleCard />
            </div>
          </div>

          {/* Bottom Section: Contact the Trustees & Committee */}
          <div className="pt-12 border-t border-[#E8D7B5]">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <SectionHeading
                overline={t('contactPage.reachOutOverline', 'Reach Out')}
                heading={t('contactPage.reachOutHeading', 'Contact the Trustees')}
                align="center"
                className="mb-0"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {trustees.map((tItem) => (
                <ContactCard
                  key={tItem.id}
                  name={tItem.name}
                  nameTa={tItem.nameTa}
                  role={tItem.role}
                  roleTa={tItem.roleTa}
                  phones={tItem.phone}
                  image={tItem.image}
                />
              ))}
            </div>

            {/* Enquiry banner */}
            <div className="bg-[#F2EBDD] border border-[#E8D7B5] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-sm text-[#77736A] font-sans leading-relaxed">
                {t('contactPage.donationEnquiryNote', 'For donations and bank transfer enquiries, please visit the Donation page for full bank details.')}
              </p>
              <Link
                to="/donation"
                className="inline-flex items-center gap-2 bg-[#173F35] hover:bg-[#0E2D27] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
              >
                <span>{t('nav.donation', 'Donation')}</span>
              </Link>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
