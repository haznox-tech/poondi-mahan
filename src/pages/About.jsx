import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Heart,
  Compass,
  Landmark,
  Users,
  Flame,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO.jsx";
import PageHero from "../components/PageHero.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import {
  BreadcrumbSchema,
  WebPageSchema,
  ArticleSchema,
} from "../components/StructuredData.jsx";
import { pageSEO } from "../data/seo.js";

export default function About() {
  const seo = pageSEO.about;
  const { t } = useTranslation();

  const sections = [
    {
      id: "madman-on-the-verandah",
      overline: t("about.sections.introOverline", "The Enigma of Poondi"),
      heading: t(
        "about.sections.introHeading",
        '1. The "Madman" on the Verandah',
      ),
      image: "/images/gallery/poondi-ashramam-aradhana-procession-deepam.webp",
      alt: "Sri Poondi Mahan - The enigmatic sage seated in divine stillness",
      icon: Sparkles,
      content: [
        t(
          "about.sections.introP1",
          'In the dusty village of Poondi, tucked away in the spiritual shadow of Tiruvannamalai, there once lived a man who lived in defiance of every human convention. To a casual journalist passing through in the 1960s, the sight would have been jarring: a man sitting amidst grime and cactus, wearing layers of tattered shirts—one pulled over the other until he appeared physically bloated by rags. His hair was a matted nest of earth; his eyes were perpetually clouded with rheum, yet they possessed a "sharp and shining" quality that stopped onlookers in their tracks. He never bathed, rarely spoke, and appeared to the uninitiated as nothing more than a local madman.',
        ),
        t(
          "about.sections.introP2",
          'How did such a figure, who completely neglected the vessel of his own body, come to be hailed as a Samrat — an Emperor — among saints? Why did the most realized masters of the 20th century travel miles just to sit in his silent, unmoving presence? This exploration seeks to understand the "Human Transmitter," Sri Poondi Mahan (also known as "Attru Swamy"), and distills the most impactful takeaways from a life defined by nearly two decades of absolute physical stillness.',
        ),
      ],
    },
    {
      id: "transmitter-analogy",
      overline: t(
        "about.sections.transmitterOverline",
        "Kanchi Maha Periyavar's Revelation",
      ),
      heading: t(
        "about.sections.transmitterHeading",
        '2. The Power of the "Transmitter" Analogy',
      ),
      image: "/images/gallery/kanchi-maha-periyava-chandrashekarendra-saraswathi.webp",
      alt: "Sri Poondi Mahan - The raw power source and spiritual transmitter",
      icon: Flame,
      content: [
        t(
          "about.sections.transmitterP1",
          'One of the most sophisticated validations of Poondi Mahan’s spiritual stature came from the Kanchi Maha Periyavar, Sri Chandrasekharendra Saraswathi Swamigal. To explain Mahan’s state to his own devotees, the Kanchi Seer utilized a striking technological metaphor that remains the definitive description of the Swami\'s power. He made a clear distinction between a spiritual "light" and the source of the "current" itself: "We are like bulbs. But Poondi Swami is like transmitter. These bulbs will not glow unless that transmitter is switched on."',
        ),
        t(
          "about.sections.transmitterP2",
          'In the complex hierarchy of Brahmasthithi — the state of being established in the Absolute — Poondi Mahan was viewed not as a teacher, but as the raw power source. This distinction is vital. While many saints provide a path or a "light," Mahan was the "Transmitter" that allowed those bulbs to function. According to the ancient wisdom of Adi Shankara, a Brahmavarishtan (the highest of liberated beings) often appears to the world as child-like, mentally affected, or even "haunted." Mahan embodied this paradox; he was a Samrat in the realm of consciousness while appearing as a mendicant in the realm of matter.',
        ),
      ],
    },
    {
      id: "cheyyar-river-flood",
      overline: t("about.sections.floodOverline", "Origin of Attru Swamy"),
      heading: t(
        "about.sections.floodHeading",
        "3. The Miracle of the Cheyyar River: Surviving the Flood",
      ),
      image: "/images/gallery/poondi-riverbed-sacred-tapas-mandapam.webp",
      alt: "Sri Poondi Mahan performing intense tapas along the sacred Cheyyar riverbank",
      icon: Compass,
      content: [
        t(
          "about.sections.floodP1",
          "Before settling into permanent residence in the village, the Swami was often found in the dry bed of the Cheyyar River. He would sit in the blistering heat of the Indian summer on sands so hot they would sear the feet of any common traveler, yet he remained as composed as if he were resting on silk.",
        ),
        t(
          "about.sections.floodP2",
          "His specific Tamil honorific, Attru Swamy (River Swami), was derived from the word 'aaru' (river) following a terrifying natural event. During a season of heavy rains in the hills, a flash flood surged through the dry riverbed. Villagers, certain that the \"madman\" had been swept to a watery grave, rushed to the banks after the waters receded. They were met with a physical impossibility: they found the Swami buried up to his neck in the sand, alive, calm, and entirely unaffected by the deluge. This event served as a public demonstration of Ajakaravastha — the passive, immobile state where a master has transcended the survival instincts of the ego.",
        ),
      ],
    },
    {
      id: "18-year-verandah-stillness",
      overline: t(
        "about.sections.stillnessOverline",
        "The Python State (Ajakaravastha)",
      ),
      heading: t(
        "about.sections.stillnessHeading",
        "4. Absolute Stillness: The 18-Year Verandah Residence",
      ),
      image: "/images/gallery/poondi-river-historic-tapas-spot.webp",
      alt: "Sacred Tapas Mandapam and Ashramam grounds at Kalasapakkam on Cheyyar river",
      icon: Landmark,
      content: [
        t(
          "about.sections.stillnessP1",
          "Around 1959 or 1960, Poondi Mahan ascended the raised porch of a house in Poondi and sat down. He would not leave that small space for eighteen years. This period is perhaps the most visceral account of spiritual penance in modern history. He did not move for his own needs; he did not feed himself; he simply was.",
        ),
        t(
          "about.sections.stillnessP2",
          'To understand the depth of his Ajakaravastha, one must look at the etymology: Ajagara refers to the "python," a creature that remains in total stillness, waiting for providence. Mahan took this to the extreme of the "python state." The most shocking evidence of his detachment from the flesh was the account of a colony of ants that burrowed into his leg. Because he remained immobile in deep yoga nishtha, the insects created a hole from his foot to his knee, consuming his flesh and blood. Witnesses were spellbound; the Swami remained in deep meditation, possessing "not even the sense that he had a body." This total disregard for the physical frame is the ultimate counter-intuitive lesson of his life: that the "Transmitter" remains functional even as the "hardware" is ignored.',
        ),
      ],
    },
    {
      id: "transparent-mirror",
      overline: t(
        "about.sections.mirrorOverline",
        "Psychic Reflection & Leela",
      ),
      heading: t(
        "about.sections.mirrorHeading",
        "5. The Transparent Mirror: Reflecting the Seeker",
      ),
      image: "/images/gallery/poondi-ashramam-deepa-aradhana-seva.webp",
      alt: "Sri Poondi Mahan blessing devotees with boundless compassion",
      icon: Users,
      content: [
        t(
          "about.sections.mirrorP1",
          'Mahan was often described as a "Transparent Mirror." He possessed no fixed mood of his own; instead, he acted as a perfect psychic reflector for those who approached him. The record shows that if a photographer approached him with a timid or fearful expression, that exact look of fear would immediately manifest on the Swami’s face. If a visitor was friendly, he was friendly.',
        ),
        t(
          "about.sections.mirrorP2",
          'This "Mirror" phenomenon was a tool for leela (divine play) and spiritual correction. A notable account involves a young man who approached the Swami while secretly harboring greed—he was planning a second marriage solely for a dowry. As the man fed the Swami orange carpels, an impossible physical feat occurred: for every one carpel the man placed in the Swami\'s mouth, the Swami would spit out two. This continued until Mahan exposed the man’s hidden intent with a single, repeating phrase: "He is expecting two in place of one... He is expecting two in place of one." Realizing his internal greed had been physically manifested and mirrored back to him, the man cancelled his plans. Mahan’s dharbar was open to all, but it was a court where one could not hide from their own reflection.',
        ),
      ],
    },
    {
      id: "transcendence-over-materiality",
      overline: t(
        "about.sections.renunciationOverline",
        "Sand, Stones & Rejection of Wealth",
      ),
      heading: t(
        "about.sections.renunciationHeading",
        "6. Transcendence Over Materiality: Sand, Stones, and Rejection of Wealth",
      ),
      image: "/images/gallery/poondi-ashramam-annadanam-prasad-seva.webp",
      alt: "Sri Poondi Mahan Ashramam sacred Annadanam Prasad Seva and supreme renunciation",
      icon: Heart,
      content: [
        t(
          "about.sections.renunciationP1",
          "Poondi Mahan’s existence was a sustained rejection of material laws. His diet was famously erratic; when not fed by devotees like a child, he was known to consume sand, cactus fruits, and even gravel stones. He maintained a total indifference to money; when wealthy visitors placed currency notes between his fingers, he remained motionless even as local children snatched the notes away.",
        ),
        t(
          "about.sections.renunciationP2",
          'Furthermore, the "unspoiled offerings" near his verandah defied the laws of biology. Heaps of fruits and flowers were left near him for years. While they would eventually dry, they reportedly never rotted, never produced a foul smell, and never attracted the typical signs of decay. Mahan’s own philosophy on wealth was absolute: "I\'m an alms-folk. I don\'t want money... It is not meant for me."',
        ),
      ],
    },
    {
      id: "beyond-the-physical-frame",
      overline: t(
        "about.sections.conclusionOverline",
        "Mahasamadhi & Eternal Radiance",
      ),
      heading: t(
        "about.sections.conclusionHeading",
        "7. Conclusion: Beyond the Physical Frame",
      ),
      image: "/images/gallery/sri-poondi-mahan-holy-darshan.webp",
      alt: "Holy Samadhi Sanctum of Sri Poondi Mahan with eternal light",
      icon: Sparkles,
      content: [
        t(
          "about.sections.conclusionP1",
          'Sri Poondi Mahan attained Mahasamadhi in the early days of November 1978 (recorded by the ashram as November 3rd). Following his passing, heavy rains lashed the region for three days—a "divine intervention" that devotees believed kept the atmosphere pristine and the weather cool, allowing followers from across the state time to travel for a final darshan. Even after three days, witnesses noted his body showed no signs of decomposition and radiated a distinct, healthy glow.',
        ),
        t(
          "about.sections.conclusionP2",
          'The life of the "River Swami" leaves us with a haunting question: If a man can remain immobile for 18 years, unbothered by the consumption of his own flesh by insects or the lashing of the elements, what does that tell us about the hidden "transmitter" within ourselves? Poondi Mahan remains a testament to the "Perfect Saint"—a being who required nothing from the world because he was the source of the current itself. He reminds us that beneath the frantic noise of the human experience, there is a state of stillness that is the source of all light.',
        ),
      ],
    },
  ];

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
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <WebPageSchema
        name={seo.title}
        description={seo.description}
        url="/about"
        about="Sri Poondi Mahan"
      />
      <ArticleSchema
        headline={seo.title}
        description={seo.description}
        image="/images/swami/poondi-mahan-portrait.webp"
        datePublished="2024-01-01"
      />

      <PageHero
        title={t("about.heroTitle", "The Human Transmitter")}
        subtitle={t(
          "about.heroSubtitle",
          "7 Surprising Lessons from the 18-Year Stillness of Sri Poondi Mahan (Attru Swamy)",
        )}
        breadcrumbs={[{ label: t("nav.about", "About") }]}
        bgImage="/images/hero/sri-poondi-mahan-spiritual-legacy-hero.webp"
      />

      {/* Chapters / Timeline Sections */}
      <article
        className="py-16 lg:py-24 bg-[#FAF7F0]"
        aria-label="About Sri Poondi Mahan"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-10 space-y-20 lg:space-y-28">
          {sections.map((sec, i) => {
            const isEven = i % 2 === 0;
            const IconComponent = sec.icon;

            return (
              <section
                key={sec.id}
                id={sec.id}
                aria-labelledby={`${sec.id}-heading`}
                className="scroll-mt-10"
              >
                {/* Mobile Section Heading (visible on mobile < lg) */}
                <div className="lg:hidden mb-6">
                  <SectionHeading
                    overline={sec.overline}
                    heading={sec.heading}
                    id={`${sec.id}-heading-mobile`}
                  />
                </div>

                <div
                  className={`grid lg:grid-cols-12 gap-8 lg:gap-14 items-center ${isEven ? "" : "lg:grid-flow-dense"}`}
                >
                  {/* Image Column */}
                  <div
                    className={`lg:col-span-5 ${isEven ? "lg:order-1" : "lg:order-2 lg:col-start-8"}`}
                  >
                    <div className="relative group">
                      {/* Decorative outer glow & border frame */}
                      <div
                        className="absolute -inset-2 bg-gradient-to-tr from-[#B78A3B]/30 to-[#173F35]/20 rounded-2xl filter blur-sm group-hover:blur-md transition-all duration-300"
                        aria-hidden="true"
                      />

                      <div className="relative bg-white p-2.5 rounded-2xl border border-[#E8D7B5] shadow-lg overflow-hidden">
                        <div className="relative h-80 sm:h-[420px] lg:h-[500px] rounded-xl overflow-hidden bg-[#173F35]/10">
                          <img
                            src={sec.image}
                            alt={sec.alt}
                            loading={i === 0 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover:opacity-50 transition-opacity duration-500" />

                          {/* Premium Chapter Badge */}
                          <div className="absolute bottom-3.5 right-3.5 inline-flex items-center bg-[#0E2D27]/85 backdrop-blur-md text-[#D8B86A] text-[11px] sm:text-xs font-sans font-semibold tracking-wider uppercase px-3.5 py-1.5 rounded-full border border-[#D8B86A]/40 shadow-lg shadow-black/40 group-hover:border-[#D8B86A]/70 group-hover:bg-[#0E2D27]/95 transition-all duration-300 select-none">
                            <span className="drop-shadow-xs">
                              {sec.overline}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Content Column */}
                  <div
                    className={`lg:col-span-7 ${isEven ? "lg:order-2" : "lg:order-1 lg:col-start-1"}`}
                  >
                    <div className="space-y-4">
                      {/* Desktop Section Heading (hidden on mobile < lg) */}
                      <div className="hidden lg:block">
                        <SectionHeading
                          overline={sec.overline}
                          heading={sec.heading}
                          id={`${sec.id}-heading`}
                        />
                      </div>
                      <div className="space-y-4 text-[#77736A] leading-relaxed font-sans text-base sm:text-lg pt-1 lg:pt-2">
                        {sec.content.map((p, j) => (
                          <p key={j} className="text-justify sm:text-left">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ornamental Section Divider */}
                {i < sections.length - 1 && (
                  <div className="flex items-center justify-center gap-4 mt-16 lg:mt-24 max-w-xl mx-auto">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8D7B5] to-[#B78A3B]/40" />
                    <span
                      className="text-[#B78A3B] text-sm font-serif select-none"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#E8D7B5] to-[#B78A3B]/40" />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </article>

      {/* Pull Quote */}
      <section
        className="py-20 lg:py-24 bg-[#F2EBDD] relative overflow-hidden"
        aria-label="Quote from Sri Poondi Mahan"
      >
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="bg-white/70 backdrop-blur-xs border border-[#E8D7B5] rounded-3xl p-8 sm:p-12 shadow-md relative">
            <span
              className="text-4xl sm:text-5xl font-serif text-[#B78A3B]/40 leading-none block mb-2"
              aria-hidden="true"
            >
              “
            </span>
            <blockquote className="font-serif text-xl sm:text-2xl lg:text-3xl italic text-[#173F35] leading-relaxed mb-6">
              {t(
                "about.quote",
                '"In the eyes of the Divine, every soul is equally beloved. To serve one is to serve all."',
              )}
            </blockquote>
            <div className="w-16 h-0.5 bg-[#B78A3B] mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-[#77736A] font-sans tracking-widest uppercase font-medium">
              {t(
                "about.quoteAuthor",
                "— As remembered by devotees of Sri Poondi Mahan",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Internal Navigation Links */}
      <section
        className="py-16 lg:py-20 bg-[#FAF7F0] border-t border-[#E8D7B5]/60"
        aria-label="Explore more"
      >
        <div className="max-w-6xl mx-auto px-4 lg:px-10">
          <div className="text-center mb-10">
            <p className="text-[11px] font-sans font-semibold tracking-widest uppercase text-[#B78A3B] mb-1">
              {t("about.exploreOverline", "Explore Further")}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#173F35] font-semibold">
              {t("about.exploreTitle", "Continue Exploring")}
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                label: t("about.link1Title", "Meet the Trustees"),
                path: "/trustees",
                desc: t(
                  "about.link1Desc",
                  "Serving his legacy today with devotion",
                ),
                icon: Landmark,
              },
              {
                label: t("about.link2Title", "Explore the Gallery"),
                path: "/gallery",
                desc: t(
                  "about.link2Desc",
                  "Sacred photographs and devotional moments",
                ),
                icon: Sparkles,
              },
              {
                label: t("about.link3Title", "Support Annadanam"),
                path: "/donation",
                desc: t(
                  "about.link3Desc",
                  "Continue the unbroken tradition of seva",
                ),
                icon: Heart,
              },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="group block bg-white border border-[#E8D7B5] rounded-2xl p-6 sm:p-7 hover:border-[#B78A3B] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E8D7B5] flex items-center justify-center text-[#B78A3B] mb-4 group-hover:bg-[#173F35] group-hover:text-[#FAF7F0] transition-colors">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl text-[#173F35] group-hover:text-[#B78A3B] transition-colors mb-2 flex items-center justify-between">
                    <span>{link.label}</span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="text-[#B78A3B] -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                    />
                  </h3>
                  <p className="text-xs sm:text-sm text-[#77736A] font-sans leading-relaxed">
                    {link.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
