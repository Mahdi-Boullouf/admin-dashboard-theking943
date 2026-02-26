"use client";

import { useState, useEffect } from "react";

const sections = [
  {
    id: "information-we-collect",
    number: "01",
    title: "Information We Collect",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    subsections: [
      {
        title: "Personal Information",
        tag: "1.1",
        content:
          "When you register or use the application, we may collect your full name, phone number, email address, profile details (photo, gender, specialization for doctors, etc.), and account login credentials (securely encrypted).",
      },
      {
        title: "Medical & Appointment Information",
        tag: "1.2",
        content:
          "To enable healthcare services, we may collect appointment details (doctor, date, time), information you choose to share with doctors, files and documents uploaded during consultations, and messages exchanged within the platform. DocMobi does not access or use medical information outside what users voluntarily provide.",
      },
      {
        title: "Technical & Device Information",
        tag: "1.3",
        content:
          "We automatically collect limited technical data including device type and operating system, app usage behavior and analytics, crash logs and diagnostics, and IP address for security and fraud prevention.",
      },
      {
        title: "Location Information",
        tag: "1.4",
        optional: true,
        content:
          "If you allow location access, we use it to show nearby doctors and clinics and improve search relevance. You may disable location services at any time in your device settings.",
      },
    ],
  },
  {
    id: "how-we-use",
    number: "02",
    title: "How We Use Your Information",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    items: [
      "Provide appointment booking and management services",
      "Enable communication between patients and healthcare providers",
      "Improve application performance and user experience",
      "Send important notifications (appointments, calls, updates)",
      "Maintain system security and prevent misuse",
      "Provide customer and technical support",
      "Comply with legal obligations when required",
    ],
    highlight: "We do not sell or rent your personal data to third parties.",
  },
  {
    id: "data-sharing",
    number: "03",
    title: "Data Sharing",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
    intro: "We only share information when necessary:",
    items: [
      "Between patient and doctor for consultation purposes",
      "With secure service providers (hosting, notifications, infrastructure)",
      "When required by law or legal authorities",
      "To protect the safety, rights, or integrity of users and the platform",
    ],
    footer: "All partners are required to follow strict confidentiality and security standards.",
  },
  {
    id: "security",
    number: "04",
    title: "Data Storage & Security",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    measures: [
      { label: "Encrypted Communication", detail: "HTTPS / SSL" },
      { label: "Secure Authentication", detail: "Auth Systems" },
      { label: "Restricted Server Access", detail: "Access Control" },
      { label: "Regular Monitoring", detail: "24 / 7" },
    ],
    disclaimer:
      "No digital platform can guarantee absolute security. Users should also protect their account credentials.",
  },
  {
    id: "user-rights",
    number: "05",
    title: "User Control & Rights",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
    ),
    rights: [
      { right: "Access or update your personal information", icon: "✎" },
      { right: "Request deletion of your account", icon: "✕" },
      { right: "Disable notifications or permissions", icon: "◎" },
      { right: "Stop using the service at any time", icon: "◻" },
    ],
    cta: "To request account deletion or data changes, contact us directly (see Contact section).",
  },
  {
    id: "retention",
    number: "06",
    title: "Data Retention",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    content:
      "We keep your data only as long as necessary to provide services, maintain medical and appointment history, and meet legal or operational requirements. When no longer needed, data is securely deleted.",
  },
  {
    id: "children",
    number: "07",
    title: "Children's Privacy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    content:
      "DocMobi is not intended for use by children under 13 without supervision. We do not knowingly collect personal information from minors without appropriate consent.",
  },
  {
    id: "changes",
    number: "08",
    title: "Changes to This Policy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    content:
      "We may update this Privacy Policy from time to time. Any changes will be posted inside the application with an updated revision date. Continued use of DocMobi means you accept the updated policy.",
  },
];

function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);
  return activeId;
}

export default function PrivacyPolicy() {
  const sectionIds = sections.map((s) => s.id);
  const activeId = useActiveSection(sectionIds);
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  const [readSections, setReadSections] = useState<Set<string>>(
    new Set([sectionIds[0]])
  );

  useEffect(() => {
    setReadSections((prev) => new Set([...prev, activeId]));
  }, [activeId]);

  const toggleSub = (key: string) =>
    setExpandedSubs((prev) => ({ ...prev, [key]: !prev[key] }));

  const progress = Math.round((readSections.size / sections.length) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-border">
        <div
          className="h-full bg-foreground transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero */}
      <header className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full border border-primary-foreground" />
          <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full border border-primary-foreground" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full border border-primary-foreground" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 mb-8">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4 opacity-70"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
            <span className="text-xs tracking-widest uppercase opacity-70 font-mono">
              DocMobi
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-none tracking-tight">
            Privacy
            <br />
            <span className="opacity-30">Policy</span>
          </h1>

          <p className="mt-6 text-primary-foreground/60 text-base max-w-md leading-relaxed">
            We believe transparency builds trust. Here's exactly how we handle
            your personal health data.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-primary-foreground/40 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/40" />
              Last updated Feb 25, 2026
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/40" />
              {sections.length} sections
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              {progress}% read
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-14 flex gap-14">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-10">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono mb-3 px-3">
              Contents
            </p>

            <nav className="space-y-0.5">
              {sections.map((s) => {
                const isActive = activeId === s.id;
                const isRead = readSections.has(s.id) && !isActive;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono tabular-nums shrink-0 ${
                        isActive ? "opacity-50" : "opacity-30"
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="flex-1 leading-snug">{s.title}</span>
                    {isRead && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground/25 shrink-0" />
                    )}
                  </a>
                );
              })}
            </nav>

            <div className="mt-5 rounded-lg border border-border bg-card p-4 space-y-2.5">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Reading progress</span>
                <span>
                  {readSections.size}/{sections.length}
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-10">
          {/* 01 — Information We Collect */}
          <section id={sections[0].id} className="scroll-mt-10">
            <SectionHeader section={sections[0]} />
            <div className="mt-4 space-y-2">
              {sections[0].subsections!.map((sub, i) => {
                const key = `sub-${i}`;
                const open = expandedSubs[key] ?? false;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSub(key)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent transition-colors duration-150"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                        {sub.tag}
                      </span>
                      <span className="font-medium text-card-foreground flex-1 text-sm">
                        {sub.title}
                      </span>
                      {sub.optional && (
                        <span className="text-[10px] font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">
                          Optional
                        </span>
                      )}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        open ? "max-h-64" : "max-h-0"
                      }`}
                    >
                      <p className="px-5 pb-5 pt-3 text-sm text-muted-foreground leading-relaxed border-t border-border">
                        {sub.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 02 — How We Use */}
          <section id={sections[1].id} className="scroll-mt-10">
            <SectionHeader section={sections[1]} />
            <div className="mt-4 rounded-lg border border-border bg-card p-5 space-y-3">
              {sections[1].items!.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className="w-2.5 h-2.5 text-foreground"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
              <div className="pt-4 mt-1 border-t border-border flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-4 h-4 text-foreground shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <p className="text-sm font-medium text-foreground">
                  {sections[1].highlight}
                </p>
              </div>
            </div>
          </section>

          {/* 03 — Data Sharing */}
          <section id={sections[2].id} className="scroll-mt-10">
            <SectionHeader section={sections[2]} />
            <div className="mt-4 rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-4">
                {sections[2].intro}
              </p>
              <div className="space-y-2.5">
                {sections[2].items!.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="text-foreground/30 shrink-0 mt-0.5">
                      →
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground italic">
                {sections[2].footer}
              </p>
            </div>
          </section>

          {/* 04 — Security */}
          <section id={sections[3].id} className="scroll-mt-10">
            <SectionHeader section={sections[3]} />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {sections[3].measures!.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2.5"
                >
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded self-start">
                    {m.detail}
                  </span>
                  <span className="text-sm font-medium text-card-foreground leading-snug">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground italic px-1">
              {sections[3].disclaimer}
            </p>
          </section>

          {/* 05 — User Rights */}
          <section id={sections[4].id} className="scroll-mt-10">
            <SectionHeader section={sections[4]} />
            <div className="mt-4 space-y-2">
              {sections[4].rights!.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-lg border border-border bg-card text-sm"
                >
                  <span className="text-base text-muted-foreground/40 shrink-0 w-5 text-center">
                    {r.icon}
                  </span>
                  <span className="text-muted-foreground">{r.right}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 rounded-lg border border-border bg-secondary px-5 py-3.5 text-sm text-secondary-foreground">
              {sections[4].cta}
            </div>
          </section>

          {/* 06, 07, 08 — Simple sections */}
          {[sections[5], sections[6], sections[7]].map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-10">
              <SectionHeader section={s} />
              <div className="mt-4 rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.content}
                </p>
              </div>
            </section>
          ))}

          {/* Contact */}
          <section id="contact" className="scroll-mt-10">
            <div className="rounded-xl border border-border bg-primary text-primary-foreground p-8 relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-primary-foreground" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full border border-primary-foreground" />
              </div>

              <div className="relative">
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-40">
                  09 — Contact
                </span>
                <h2 className="text-2xl font-bold mt-3 mb-1 tracking-tight">
                  Questions? Reach Us.
                </h2>
                <p className="text-primary-foreground/50 text-sm mb-7">
                  We're committed to resolving any privacy-related concerns
                  promptly.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="mailto:mydoctoralgerie@gmail.com"
                    className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-lg px-5 py-3 text-sm"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4 opacity-60 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                    <span className="opacity-80 font-mono text-xs">
                      mydoctoralgerie@gmail.com
                    </span>
                  </a>
                  <a
                    href="tel:0558585400"
                    className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-lg px-5 py-3 text-sm"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4 opacity-60 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z"
                      />
                    </svg>
                    <span className="opacity-80 font-mono text-xs">
                      0558 585 400
                    </span>
                  </a>
                </div>

                <p className="mt-6 text-[11px] font-mono opacity-30">
                  Bouras Aissam — CEO, DocMobi
                </p>
              </div>
            </div>
          </section>

          <footer className="text-center text-xs text-muted-foreground pb-14 pt-4 font-mono">
            By using DocMobi, you acknowledge that you have read and understood
            this Privacy Policy.
          </footer>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ section }: { section: (typeof sections)[0] }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-foreground shrink-0">
        {section.icon}
      </div>
      <div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {section.number}
        </span>
        <h2 className="text-lg font-semibold text-foreground leading-tight tracking-tight">
          {section.title}
        </h2>
      </div>
    </div>
  );
}