import { useState, useEffect, type JSX } from "react";
import { supabase } from "./supabase"; // Connects to your database

export type PanelType = "muzik" | "kalendar" | "lokasi" | "hubungi" | "rsvp" | null;

interface NavbarProps {
  isOpened: boolean;
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  isPlaying: boolean;
  toggleMusic: () => void;
  scale: number;
}

export const Navbar = ({ isOpened, activePanel, setActivePanel, isPlaying, toggleMusic, scale }: NavbarProps): JSX.Element => {
  const [rsvpStep, setRsvpStep] = useState<"menu" | "hadir" | "tidak_hadir">("menu");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  
  // Supabase submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guestSide, setGuestSide] = useState<string>("");

  useEffect(() => {
    if (activePanel !== "rsvp") {
      setRsvpStep("menu");
      setRsvpSubmitted(false);
      setSubmitError(null);
      setGuestSide("");
    }
  }, [activePanel]);

  const downloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20261212T020000Z
DTEND:20261212T060000Z
SUMMARY:Majlis Perkahwinan Afif & Husna
DESCRIPTION:Majlis Perkahwinan Afif Danial & Husna Zulaiqah
LOCATION:Kompleks Sukan\\, Asajaya\\, Sarawak\\, Malaysia
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Majlis_Perkahwinan_Afif_Husna.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUPABASE SUBMISSION LOGIC ---
  const handleRsvpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string | null;
    const message = formData.get("message") as string | null;
    
    // CHANGED: Directly parse the raw number input instead of splitting text
    const attendanceRaw = formData.get("attendance") as string;
    let pax = 0;
    if (rsvpStep === "hadir" && attendanceRaw) {
      pax = parseInt(attendanceRaw) || 1;
    }

    // Insert response into Supabase securely
    const { error } = await supabase
      .from('rsvp_responses')
      .insert([
        {
          guest_name: name,
          attendance_status: rsvpStep === "hadir" ? "hadir" : "tidak_hadir",
          guest_side: rsvpStep === "hadir" ? guestSide : null,
          phone: phone,
          pax: pax,
          message: message
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Supabase Error:", error);
      setSubmitError("Ralat pelayan. Sila pastikan internet anda stabil dan cuba lagi.");
    } else {
      setRsvpSubmitted(true);
    }
  };

  const navItems = [
    { id: "muzik", label: "Muzik", icon: <path d="M9 18V5l12-2v13M9 9l12-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> },
    { id: "kalendar", label: "Kalendar", icon: <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" /> },
    { id: "lokasi", label: "Lokasi", icon: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" /> },
    { id: "hubungi", label: "Hubungi", icon: <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /> },
    { id: "rsvp", label: "RSVP", icon: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /> },
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 mx-auto z-100 transition-all duration-1500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isOpened ? "opacity-100 translate-y-0 delay-3500" : "opacity-0 translate-y-full pointer-events-none"
      }`}
      style={{ width: `${393 * scale}px` }}
    >
      <div 
        className={`absolute bottom-15 left-0 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom ${
          activePanel ? "translate-y-0" : "translate-y-[120%]"
        }`}
      >
        <div className="relative w-full px-6 py-6 font-garamond overscroll-none">
          <button 
            onClick={() => setActivePanel(null)} 
            className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* MUZIK PANEL */}
          {activePanel === "muzik" && (
            <div className="text-center">
              <h2 className="mb-6 font-semibold italic text-2xl">Muzik Latar</h2>
              <div className="flex justify-center mb-4">
                <button onClick={toggleMusic} className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors">
                  {isPlaying ? <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
              </div>
              <p className="text-stone-500 text-[15px]">{isPlaying ? "Muzik sedang dimainkan" : "Muzik dihentikan"}</p>
            </div>
          )}

          {/* KALENDAR PANEL */}
          {activePanel === "kalendar" && (
            <div className="text-center">
              <h2 className="mb-2 font-semibold italic text-2xl">Simpan Tarikh</h2>
              <p className="text-stone-500 text-[15px] mb-8">Sabtu, 12 Disember 2026<br/>10:00 am - 2:00 pm</p>
              <div className="flex flex-col gap-3">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Majlis+Perkahwinan+Afif+%26+Husna&details=Majlis+Perkahwinan+Afif+Danial+%26+Husna+Zulaiqah&location=Kompleks+Sukan,+Asajaya,+Sarawak,+Malaysia&dates=20261212T020000Z/20261212T060000Z" target="_blank" rel="noreferrer" className="rounded-full border border-stone-800 bg-white px-6 py-2.5 text-stone-800 hover:bg-stone-50 transition-colors">Google Calendar</a>
                <button onClick={downloadICS} className="rounded-full border border-stone-800 bg-white px-6 py-2.5 text-stone-800 hover:bg-stone-50 transition-colors">Apple Calendar</button>
              </div>
            </div>
          )}

          {/* LOKASI PANEL */}
          {activePanel === "lokasi" && (
            <div className="text-center">
              <h2 className="mb-2 font-semibold italic text-2xl">Arah Tujuan</h2>
              <p className="text-stone-500 text-[15px] mb-8 leading-snug">Kompleks Sukan, Asajaya<br/>Jalan Kota Samarahan - Sadong Jaya</p>
              <div className="flex flex-col gap-3">
                <a href="https://maps.google.com/?q=Kompleks+Sukan,+Asajaya,+Sarawak,+Malaysia" target="_blank" rel="noreferrer" className="rounded-full border border-stone-800 bg-white px-6 py-2.5 text-stone-800 hover:bg-stone-50 transition-colors">Buka di Google Maps</a>
                <a href="https://waze.com/ul?q=Kompleks+Sukan+Asajaya&navigate=yes" target="_blank" rel="noreferrer" className="rounded-full border border-stone-800 bg-white px-6 py-2.5 text-stone-800 hover:bg-stone-50 transition-colors">Buka di Waze</a>
              </div>
            </div>
          )}

          {/* HUBUNGI PANEL */}
          {activePanel === "hubungi" && (
            <div>
              <h2 className="mb-8 text-center font-semibold italic text-2xl">Hubungi Keluarga</h2>
              <div className="mb-6">
                <h3 className="font-semibold text-lg border-b border-stone-200 pb-1 mb-3">Keluarga Pengantin Lelaki</h3>
                {[
                  { name: "Noruden bin Nong", role: "Bapa", phone: "+60167136972" },
                  { name: "Kasmirul Iqmal bin Noruden", role: "Abang", phone: "+60162356972" }
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-stone-800">{c.name}</p>
                      <p className="text-sm text-stone-500">{c.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${c.phone}`} className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-600"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></a>
                      <a href={`https://wa.me/${c.phone.replace('+','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-600"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-lg border-b border-stone-200 pb-1 mb-3">Keluarga Pengantin Perempuan</h3>
                {[
                  { name: "Zamberi bin Sapi'ee", role: "Bapa", phone: "+60123456789" },
                  { name: "Abg Kak Na bin Zamberi", role: "Abang", phone: "+60174797614" }
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-stone-800">{c.name}</p>
                      <p className="text-sm text-stone-500">{c.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${c.phone}`} className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-600"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></a>
                      <a href={`https://wa.me/${c.phone.replace('+','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-600"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. RSVP & UCAPAN PANEL (Database Connected) */}
          {activePanel === "rsvp" && (
            <div>
              <h2 className="mb-4 text-center font-semibold italic text-[24px]">
                {rsvpStep === "hadir" ? "RSVP & Ucapan" : rsvpStep === "tidak_hadir" ? "Ucapan" : "Sahkan Kehadiran"}
              </h2>

              {!rsvpSubmitted ? (
                <>
                  {rsvpStep === "menu" && (
                    <div className="flex flex-col gap-3 mt-4">
                      <p className="text-center text-stone-500 mb-2">Sila sahkan kehadiran anda untuk memudahkan urusan majlis kami.</p>
                      <button onClick={() => setRsvpStep("hadir")} className="w-full rounded-full border border-stone-800 bg-white px-6 py-2.5 font-medium text-stone-800 hover:bg-stone-50 transition-colors">Saya Hadir</button>
                      <button onClick={() => setRsvpStep("tidak_hadir")} className="w-full rounded-full border border-stone-800 bg-white px-6 py-2.5 font-medium text-stone-800 hover:bg-stone-50 transition-colors">Maaf, Tidak Dapat Hadir</button>
                    </div>
                  )}

                  {(rsvpStep === "hadir" || rsvpStep === "tidak_hadir") && (
                    <form onSubmit={handleRsvpSubmit} className="flex flex-col gap-3 animate-fade-up">
                      
                      {submitError && (
                        <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{submitError}</p>
                      )}

                      <div>
                        <label className="mb-1 block font-normal text-sm">Nama<span className="text-red-500">*</span></label>
                        <input required name="name" type="text" placeholder="Ali bin Abu" className="w-full rounded border border-stone-300 px-3 py-1.5 text-sm placeholder:text-stone-300 focus:border-stone-500 focus:outline-none" />
                      </div>

                      {rsvpStep === "hadir" && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block font-normal text-sm">No. Telefon<span className="text-red-500">*</span></label>
                            <input required name="phone" type="tel" placeholder="0123456789" className="w-full rounded border border-stone-300 px-3 py-1.5 text-sm placeholder:text-stone-300 focus:border-stone-500 focus:outline-none" />
                          </div>
                          {/* CHANGED: Replaced dropdown with an empty number input restricted to max 2 */}
                          <div className="flex-1">
                            <label className="mb-1 block font-normal text-sm">Kehadiran<span className="text-red-500">*</span></label>
                            <input 
                              required 
                              name="attendance" 
                              type="number" 
                              min="1" 
                              max="2" 
                              placeholder="Cth: 2" 
                              className="w-full rounded border border-stone-300 px-3 py-1.5 text-sm placeholder:text-stone-300 focus:border-stone-500 focus:outline-none" 
                            />
                          </div>
                        </div>
                      )}

                      {rsvpStep === "hadir" && (
                        <div>
                          <label className="mb-1 block font-normal text-sm">Pihak Pengantin<span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select 
                              required 
                              value={guestSide}
                              onChange={(e) => setGuestSide(e.target.value)}
                              className="w-full appearance-none rounded border border-stone-300 bg-transparent px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
                            >
                              <option value="" disabled>Pilih pihak pengantin</option>
                              <option value="perempuan">Pihak Pengantin Perempuan</option>
                              <option value="lelaki">Pihak Pengantin Lelaki</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-1 block font-normal text-sm">
                          {rsvpStep === "hadir" ? <>Ucapan Anda <span className="italic">(jika ada)</span></> : <>Ucapan Anda<span className="text-red-500">*</span></>}
                        </label>
                        <textarea required={rsvpStep === "tidak_hadir"} name="message" rows={rsvpStep === "hadir" ? 2 : 4} placeholder="Semoga kekal bahagia!" className="w-full resize-none rounded border border-stone-300 px-3 py-1.5 text-sm placeholder:text-stone-300 focus:border-stone-500 focus:outline-none" />
                      </div>

                      <div className="mt-1 flex justify-end gap-3">
                        <button type="submit" disabled={isSubmitting} className={`rounded-full border border-stone-800 bg-white px-6 py-1.5 text-sm font-medium text-stone-800 transition-colors ${isSubmitting ? 'opacity-50' : 'hover:bg-stone-50'}`}>
                          {isSubmitting ? "Sedang dihantar..." : "Hantar"}
                        </button>
                        <button type="button" onClick={() => setRsvpStep("menu")} disabled={isSubmitting} className="rounded-full border border-stone-800 bg-white px-6 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors">
                          Kembali
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-lg">Terima kasih atas maklum balas dan ucapan anda!</p>
                  <button type="button" onClick={() => { setRsvpSubmitted(false); setRsvpStep("menu"); setActivePanel(null); }} className="mx-auto mt-6 block rounded-full border border-stone-800 px-8 py-2 hover:bg-stone-50 transition-colors">Tutup</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ================= BOTTOM NAVBAR ================= */}
      <nav id="site-nav" className="relative h-16 bg-white/95 backdrop-blur-md border-t border-stone-200 flex justify-around items-center px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(isActive ? null : (item.id as PanelType))}
              className={`flex flex-col items-center justify-center w-[20%] transition-colors ${
                isActive ? "text-pink-500" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <svg 
                className={`w-6 h-6 mb-1 transition-transform ${isActive ? "scale-110" : ""}`} 
                fill={isActive ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeWidth={isActive ? "0" : "1.5"} 
                viewBox="0 0 24 24" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              <span className="text-[10px] font-medium font-sans">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};