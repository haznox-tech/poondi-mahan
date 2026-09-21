import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Smartphone,
  Landmark,
  HeartHandshake,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO.jsx";
import PageHero from "../components/PageHero.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import {
  BreadcrumbSchema,
  WebPageSchema,
  DonateActionSchema,
} from "../components/StructuredData.jsx";
import { pageSEO } from "../data/seo.js";
import { Link } from "react-router-dom";

const upiId = "8098556136@ucobank";
const upiRecipientName = "Sri Poondi Mahan Ashramam";
const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva Donation")}`;

const upiApps = [
  {
    name: "Google Pay",
    uri: `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva")}`,
  },
  {
    name: "PhonePe",
    uri: `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva")}`,
  },
  {
    name: "Paytm",
    uri: `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva")}`,
  },
  {
    name: "BHIM UPI",
    uri: `bhim://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva")}`,
  },
  {
    name: "Cred",
    uri: `cred://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiRecipientName)}&cu=INR&tn=${encodeURIComponent("Annadanam Seva")}`,
  },
  { name: "Any UPI App", uri: upiPaymentUri },
];

const bankDetails = {
  bank: "UCO Bank",
  accountName: "SRI POONDIMAHAN ATTRU SWAMY ASHRAMAM",
  accountNumber: "11610100005278",
  ifsc: "UCBA0001161",
  branch: "Kalasapakkam",
};

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[#E8D7B5]/60 last:border-0">
      <div>
        <p className="text-[11px] text-[#77736A] uppercase tracking-widest font-sans font-medium mb-0.5">
          {label}
        </p>
        <p className="font-sans font-semibold text-[#173F35] text-sm tracking-wide break-all">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="p-2 rounded-lg bg-[#F2EBDD] hover:bg-[#E8D7B5] text-[#173F35] transition-colors flex-shrink-0 cursor-pointer"
        title="Copy to clipboard"
      >
        {copied ? (
          <span className="flex items-center gap-1 text-xs text-green-700 font-sans font-medium">
            <Check size={15} /> {t("common.copied", "Copied")}
          </span>
        ) : (
          <Copy size={15} className="text-[#77736A] hover:text-[#173F35]" />
        )}
      </button>
    </div>
  );
}

export default function Donation() {
  const seo = pageSEO.donation;
  const { t } = useTranslation();
  const [upiCopied, setUpiCopied] = useState(false);
  const [desktopNotice, setDesktopNotice] = useState(false);

  const handleCopyUPI = async () => {
    const ok = await copyToClipboard(upiId);
    if (ok) {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2000);
    }
  };

  const scrollToPayment = () => {
    const target = document.getElementById("donate-payment-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePayWithUPI = (e, uri = upiPaymentUri) => {
    // Check if on mobile device
    const isMobile =
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || "",
      );

    if (isMobile) {
      // Mobile: trigger deep link intent to open payment apps chooser
      window.location.href = uri;
    } else {
      // Desktop: copy UPI ID and show helpful note + try opening URI
      e?.preventDefault();
      copyToClipboard(upiId);
      setUpiCopied(true);
      setDesktopNotice(true);
      setTimeout(() => {
        setUpiCopied(false);
        setDesktopNotice(false);
      }, 4000);
      window.location.href = uri;
    }
  };

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
          { name: "Donation", path: "/donation" },
        ]}
      />
      <WebPageSchema
        name={seo.title}
        description={seo.description}
        url="/donation"
      />
      <DonateActionSchema
        name="Support Annadanam Seva at Sri Poondi Mahan Ashramam"
        description={seo.description}
        url="/donation"
      />

      <PageHero
        title={t("donationPage.heroTitle", "Annadanam & Seva Offerings")}
        subtitle={t(
          "donationPage.heroSubtitle",
          "Support the sacred daily Annadanam and charitable activities of Sri Poondi Mahan Attru Swamy Ashramam Committee.",
        )}
        breadcrumbs={[{ label: t("nav.donation", "Donation") }]}
        bgImage="/images/hero/poondi-ashramam-annadanam-seva-hero.webp"
      />

      {/* ─── SUGGESTED SEVA SPONSORSHIP OPTIONS ─── */}
      <section
        className="py-12 lg:py-16 bg-[#FAF7F0] border-b border-[#E8D7B5]/60"
        aria-labelledby="sponsorship-heading"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <div className="bg-[#F2EBDD] border border-[#E8D7B5] rounded-2xl p-6 sm:p-8">
            <div className="max-w-3xl mb-6">
              <div className="flex items-center gap-2 text-[#B78A3B] font-serif text-sm font-semibold uppercase tracking-widest mb-1">
                <Calendar size={16} />
                <span id="sponsorship-heading">
                  {t(
                    "donationPage.sponsorshipHeading",
                    "Suggested Seva Sponsorship Offerings",
                  )}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#77736A] font-sans">
                {t(
                  "donationPage.sponsorshipSub",
                  "Devotees may dedicate sacred seva offerings on personal auspicious milestones such as birthdays, anniversaries, or in memory of ancestors:",
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  onClick={scrollToPayment}
                  className="bg-white/90 hover:bg-white rounded-xl p-5 border border-[#E8D7B5]/80 hover:border-[#B78A3B] transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#B78A3B] mb-2.5" />
                    <h4 className="font-serif font-semibold text-base text-[#173F35] group-hover:text-[#B78A3B] transition-colors mb-2">
                      {t(`donationPage.sponsorshipOptions.${idx}.title`)}
                    </h4>
                    <p className="text-xs text-[#77736A] font-sans leading-relaxed">
                      {t(`donationPage.sponsorshipOptions.${idx}.desc`)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E8D7B5]/40 flex items-center justify-between text-xs font-sans font-semibold text-[#B78A3B]">
                    <span>{t("donationPage.donateToSeva", "Offer Seva Now")}</span>
                    <ArrowDown
                      size={13}
                      className="group-hover:translate-y-0.5 transition-transform"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PAYMENT CHANNELS & OFFICIAL BANK DETAILS ─── */}
      <section
        id="donate-payment-section"
        className="py-16 lg:py-20 bg-[#FAF7F0] scroll-mt-6"
        aria-labelledby="donation-main-heading"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Purpose & Heritage */}
            <div>
              <SectionHeading
                overline={t("donationPage.overline", "Sacred Annadanam")}
                heading={t("donationPage.heading", "Your Gift, His Grace")}
                id="donation-main-heading"
              />
              <div className="space-y-4 text-[#77736A] leading-relaxed font-sans text-base mb-8">
                <p>
                  {t(
                    "donationPage.p1",
                    "Sri Poondi Mahan taught that feeding a hungry soul is the highest act of worship...",
                  )}
                </p>
                <p>
                  {t(
                    "donationPage.p2",
                    "Every rupee contributed goes directly to purchasing grains, provisions, maintaining the Ashramam sanctuary...",
                  )}
                </p>
              </div>

              {/* Seva Metrics */}
              <div className="grid grid-cols-2 divide-x divide-[#E8D7B5]/20 gap-2 sm:gap-6 mb-10 bg-[#173F35] rounded-xl p-4 sm:p-6 text-[#FAF7F0] shadow-sm">
                {[
                  {
                    stat: "365",
                    label: t("donationPage.stat1", "Days Annadanam"),
                  },
                  {
                    stat: "1,10,000+",
                    label: t("donationPage.stat2", "Souls Served per year"),
                  },
                ].map((s) => (
                  <div key={s.label} className="text-center px-2 sm:px-4 flex flex-col items-center justify-center min-h-[78px] sm:min-h-0">
                    <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#D8B86A] font-semibold sm:font-medium mb-1 tracking-tight whitespace-nowrap">
                      {s.stat}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#E8D7B5]/85 font-sans uppercase tracking-wider leading-tight">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Verified Trust Seal */}
              <div className="bg-[#F2EBDD] border border-[#E8D7B5] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#173F35]/10 flex items-center justify-center flex-shrink-0 text-[#173F35]">
                    <ShieldCheck size={22} className="text-[#B78A3B]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#173F35] font-semibold">
                      {t(
                        "donationPage.trustTitle",
                        "Official & Verified Account",
                      )}
                    </h3>
                    <p className="text-xs text-[#77736A] font-sans">
                      {t(
                        "donationPage.trustSubtitle",
                        "Official account of Sri Poondi Mahan Attru Swamy Ashramam Committee",
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-sans text-[#77736A]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>
                      {t("donationPage.trustTag1", "Zero Intermediary Fees")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>
                      {t("donationPage.trustTag2", "Direct Bank Deposit")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>
                      {t("donationPage.trustTag3", "Instant UPI Settlement")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>
                      {t("donationPage.trustTag4", "100% Seva Utilization")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advisory note */}
              <div className="flex gap-3 bg-[#FAF7F0] border border-[#E8D7B5] rounded-xl p-4 mt-6">
                <AlertCircle
                  size={18}
                  className="text-[#B78A3B] flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs text-[#77736A] font-sans leading-relaxed">
                  <strong className="text-[#173F35]">
                    {t("donationPage.advisoryTitle", "Devotee Advisory:")}
                  </strong>{" "}
                  {t(
                    "donationPage.advisoryText",
                    "Please make donations solely via the official QR Code, UPI ID, or UCO Bank details shown on this official page.",
                  )}
                </p>
              </div>
            </div>

            {/* Right: UPI QR Code & Direct Payment */}
            <div className="space-y-8">
              {/* QR Code Card */}
              <div className="bg-white border border-[#E8D7B5] rounded-2xl p-6 sm:p-8 shadow-md shadow-[#173F35]/5 text-center relative overflow-hidden">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#B78A3B] via-[#D8B86A] to-[#B78A3B]" />

                <div className="flex items-center justify-center gap-2 mb-2 text-[#173F35]">
                  <QrCode size={20} className="text-[#B78A3B]" />
                  <h2 className="font-serif text-2xl font-semibold">
                    {t("donationPage.scanHeading", "Scan & Donate via UPI")}
                  </h2>
                </div>
                <p className="text-xs text-[#77736A] font-sans mb-6 max-w-sm mx-auto">
                  {t(
                    "donationPage.scanSub",
                    "Scan this QR code with any UPI app on your phone (Google Pay, PhonePe, Paytm, BHIM, etc.)",
                  )}
                </p>

                {/* QR Code Container */}
                <div className="inline-block p-4 bg-[#FAF7F0] border-2 border-[#E8D7B5] rounded-2xl shadow-inner mb-6">
                  <QRCodeSVG
                    value={upiPaymentUri}
                    size={220}
                    level="H"
                    includeMargin={false}
                    fgColor="#0E2D27"
                    bgColor="#FAF7F0"
                    imageSettings={{
                      src: "/images/uco_bank_logo.png",
                      height: 42,
                      width: 42,
                      excavate: true,
                    }}
                  />
                  <div className="mt-3 flex items-center justify-center gap-1 text-[#B78A3B] font-serif text-sm font-semibold">
                    <span>ॐ</span>
                    <span className="text-[11px] font-sans tracking-widest uppercase text-[#77736A]">
                      {t("donationPage.verifiedQr", "Verified Merchant QR")}
                    </span>
                  </div>
                </div>

                {/* Mobile Direct Pay Action */}
                <div className="mb-6">
                  <a
                    href={upiPaymentUri}
                    onClick={(e) => handlePayWithUPI(e, upiPaymentUri)}
                    className="w-full inline-flex items-center justify-center gap-2.5 bg-[#173F35] hover:bg-[#0E2D27] text-[#FAF7F0] font-sans font-semibold text-base py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
                  >
                    <Smartphone size={18} className="text-[#D8B86A]" />
                    <span>
                      {t("donationPage.payAnyUpi", "Pay with any UPI App")}
                    </span>
                  </a>
                  <p className="text-[11px] text-[#77736A] font-sans mt-2">
                    {t(
                      "donationPage.tapMobileNote",
                      "(Tap above on mobile to automatically open Google Pay, PhonePe, Paytm, BHIM, or any UPI app)",
                    )}
                  </p>
                  {desktopNotice && (
                    <div className="mt-2 p-2 bg-[#FAF7F0] border border-[#B78A3B]/40 rounded-lg text-xs text-[#173F35] font-sans">
                      {t(
                        "donationPage.desktopNotice",
                        "✨ Official UPI ID copied! Please scan the QR code using your mobile payment app.",
                      )}
                    </div>
                  )}
                </div>

                {/* UPI ID Copy Field */}
                <div className="bg-[#FAF7F0] border border-[#E8D7B5] rounded-xl p-3.5 mb-6 flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#77736A] uppercase tracking-widest font-sans font-medium">
                      {t("donationPage.officialUpiId", "Official UPI ID")}
                    </p>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-[#173F35] truncate select-all">
                      {upiId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className="px-3.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#0E2D27] text-[#FAF7F0] text-xs font-sans font-medium transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    aria-label="Copy UPI ID"
                  >
                    {upiCopied ? (
                      <>
                        <Check size={14} className="text-[#D8B86A]" />
                        <span>{t("common.copied", "Copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>{t("common.copy", "Copy")}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Accepted Payment Apps with direct deep-links */}
                <div className="border-t border-[#E8D7B5]/60 pt-4">
                  <p className="text-[11px] text-[#77736A] font-sans uppercase tracking-wider mb-3">
                    {t(
                      "donationPage.tapPreferred",
                      "Tap to open your preferred app:",
                    )}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {upiApps.map((app) => (
                      <a
                        key={app.name}
                        href={app.uri}
                        onClick={(e) => handlePayWithUPI(e, app.uri)}
                        className="text-xs font-sans font-semibold px-3 py-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#B78A3B] hover:text-[#FAF7F0] text-[#173F35] border border-[#E8D7B5] transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs"
                      >
                        {app.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bank Transfer Details Card */}
              <div className="bg-white border border-[#E8D7B5] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Landmark size={20} className="text-[#B78A3B]" />
                  <h2 className="font-serif text-xl text-[#173F35] font-semibold">
                    {t(
                      "donationPage.bankHeading",
                      "Direct NEFT / RTGS / IMPS Details",
                    )}
                  </h2>
                </div>
                <p className="text-xs text-[#77736A] font-sans mb-4">
                  {t(
                    "donationPage.bankSub",
                    "For internet banking transfers or direct branch deposits, use the official UCO Bank details below:",
                  )}
                </p>

                <div className="bg-[#FAF7F0] rounded-xl px-4 py-2 border border-[#E8D7B5]/60">
                  <CopyField
                    label={t("donationPage.bankLabel", "Bank Name")}
                    value={bankDetails.bank}
                  />
                  <CopyField
                    label={t("donationPage.accountNameLabel", "Account Name")}
                    value={bankDetails.accountName}
                  />
                  <CopyField
                    label={t(
                      "donationPage.accountNumberLabel",
                      "Account Number",
                    )}
                    value={bankDetails.accountNumber}
                  />
                  <CopyField
                    label={t("donationPage.ifscLabel", "IFSC Code")}
                    value={bankDetails.ifsc}
                  />
                  <CopyField
                    label={t("donationPage.branchLabel", "Branch")}
                    value={bankDetails.branch}
                  />
                </div>

                <div className="mt-5 bg-[#173F35]/5 rounded-xl p-4 flex items-start gap-3">
                  <HeartHandshake
                    size={18}
                    className="text-[#B78A3B] flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-[#77736A] font-sans leading-relaxed">
                    {t(
                      "donationPage.afterTransferNote",
                      "After completing the transfer, please retain your transaction reference or receipt. For acknowledgement or queries, you may reach out to the committee via the Contact page.",
                    )}
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-[#77736A] font-sans italic">
                {t(
                  "donationPage.quote",
                  '"When you feed one hungry soul, a thousand blessings return to you." — Sri Poondi Mahan',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
