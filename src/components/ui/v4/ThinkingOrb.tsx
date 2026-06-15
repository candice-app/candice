/* .think-orb — verbatim from Candice_Redesign_Mockups_v4.html
   width:96px;height:96px;border-radius:50%;margin:0 auto;position:relative;
   background:radial-gradient(circle at 42% 34%,#2C6A52,#173E31 58%,#0D2A20);
   animation:think 2.2s ease-in-out infinite;
   box-shadow:0 0 44px rgba(62,115,97,.45)
   ::before & ::after rings: inset:-2px;border:1px solid rgba(205,185,135,.45);
   animation:ringpulse 2.6s ease-out infinite / delay:1.3s
   .c i (inner dot): width:20px;height:20px;border-radius:50%;
   background:radial-gradient(circle at 40% 35%,#F3F8F4,#94C0AC);
   box-shadow:0 0 20px rgba(180,220,200,.9) */

export default function ThinkingOrb() {
  return (
    <>
      <style>{`
        @keyframes v4Think {
          0%,100% { transform:scale(1);opacity:1 }
          50%      { transform:scale(1.06);opacity:.93 }
        }
        @keyframes v4RingPulse {
          0%   { transform:scale(.85);opacity:.55 }
          100% { transform:scale(1.5);opacity:0 }
        }
        .v4-think-ring {
          position:absolute;inset:-2px;border-radius:50%;
          border:1px solid rgba(205,185,135,.45);
          animation:v4RingPulse 2.6s ease-out infinite;
          pointer-events:none;
        }
        .v4-think-ring-2 { animation-delay:1.3s; }
      `}</style>
      <div style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        margin: "0 auto",
        position: "relative",
        background: "radial-gradient(circle at 42% 34%,#2C6A52,#173E31 58%,#0D2A20)",
        animation: "v4Think 2.2s ease-in-out infinite",
        boxShadow: "0 0 44px rgba(62,115,97,.45)",
      }}>
        <div className="v4-think-ring" />
        <div className="v4-think-ring v4-think-ring-2" />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 35%,#F3F8F4,#94C0AC)",
            boxShadow: "0 0 20px rgba(180,220,200,.9)",
          }} />
        </div>
      </div>
    </>
  );
}
