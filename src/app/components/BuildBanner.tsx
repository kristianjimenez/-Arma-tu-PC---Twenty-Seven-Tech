import { forwardRef } from "react";
import {
  PCBuild,
  ComponentCategory,
} from "../types/pc-component";
import { TAX_RATE } from "../data/store-info";
import { analyzeBuildPerformance } from "../utils/build-performance";
import logo from "../../imports/twenty_seven_tech_logo.png";

interface BuildBannerProps {
  build: PCBuild;
  username?: string;
}

const CATEGORY_EMOJI: Record<ComponentCategory, string> = {
  cpu: "🖥️",
  gpu: "🎮",
  motherboard: "📋",
  ram: "💾",
  storage: "💿",
  power: "⚡",
  case: "📦",
};

const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "Placa Base",
  ram: "RAM",
  storage: "Almacenamiento",
  power: "Fuente",
  case: "Case",
};

const CATEGORIES: ComponentCategory[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "power",
  "case",
];

const TIER_BADGE_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  ultra: {
    bg: "rgba(220,38,38,0.25)",
    border: "rgba(220,38,38,0.6)",
    text: "#fca5a5",
  },
  high: {
    bg: "rgba(168,85,247,0.2)",
    border: "rgba(168,85,247,0.5)",
    text: "#d8b4fe",
  },
  "mid-high": {
    bg: "rgba(59,130,246,0.2)",
    border: "rgba(59,130,246,0.5)",
    text: "#93c5fd",
  },
  mid: {
    bg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.4)",
    text: "#86efac",
  },
};

export const BuildBanner = forwardRef<
  HTMLDivElement,
  BuildBannerProps
>(({ build, username }, ref) => {
  const perf = analyzeBuildPerformance(build.components);
  const badgeColors = TIER_BADGE_COLORS[perf.tier];
  const total = (build.totalPrice * (1 + TAX_RATE)).toFixed(0);
  const componentCount = Object.keys(build.components).length;
  const date = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      ref={ref}
      style={{
        width: "1000px",
        height: "560px",
        background:
          "linear-gradient(145deg, #080808 0%, #0f0f0f 40%, #110000 100%)",
        color: "white",
        fontFamily:
          "'Segoe UI', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Decorative glows */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "360px",
          height: "360px",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-60px",
          width: "280px",
          height: "280px",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "38%",
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "20px 32px 16px",
          borderBottom: "1px solid rgba(220,38,38,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <img
            src={logo}
            alt="Twenty Seven Tech"
            style={{ height: "50px", width: "auto" }}
          />
          <div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: "white",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              TWENTY SEVEN TECH
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#6b7280",
                letterSpacing: "0.15em",
                marginTop: "3px",
              }}
            >
              ARMA TU PC — CONFIGURADOR
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
          }}
        >
          <div
            style={{
              background: badgeColors.bg,
              border: `1px solid ${badgeColors.border}`,
              padding: "5px 14px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "800",
              color: badgeColors.text,
              letterSpacing: "0.08em",
            }}
          >
            {perf.tierLabel}
          </div>
          {username && (
            <div style={{ fontSize: "11px", color: "#4b5563" }}>
              @{username.split("@")[0]}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        style={{ flex: 1, display: "flex", overflow: "hidden" }}
      >
        {/* Left column — Components */}
        <div
          style={{
            width: "400px",
            padding: "18px 24px",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#4b5563",
              letterSpacing: "0.14em",
              fontWeight: "700",
              marginBottom: "14px",
            }}
          >
            MI CONFIGURACIÓN
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {CATEGORIES.map((cat) => {
              const comp = build.components[cat];
              return (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {/* Icon box */}
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: comp
                        ? "rgba(220,38,38,0.15)"
                        : "rgba(255,255,255,0.04)",
                      border: comp
                        ? "1px solid rgba(220,38,38,0.35)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {CATEGORY_EMOJI[cat]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        color: comp ? "white" : "#374151",
                        fontWeight: comp ? "600" : "400",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.3,
                      }}
                    >
                      {comp ? comp.name : "— Sin seleccionar"}
                    </div>
                  </div>
                  {comp && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#f87171",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      ${comp.price}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — Games + Tasks */}
        <div
          style={{
            flex: 1,
            padding: "18px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Games */}
          <div>
            <div
              style={{
                fontSize: "10px",
                color: "#4b5563",
                letterSpacing: "0.14em",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              🎮 JUEGOS QUE PUEDE CORRER
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {perf.games.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#e5e7eb",
                      fontWeight: "500",
                    }}
                  >
                    {g.name}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#f87171",
                      background: "rgba(220,38,38,0.12)",
                      border: "1px solid rgba(220,38,38,0.2)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {g.settings}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          />

          {/* Tasks */}
          <div>
            <div
              style={{
                fontSize: "10px",
                color: "#4b5563",
                letterSpacing: "0.14em",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              ⚡ TAREAS Y PRODUCTIVIDAD
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
              }}
            >
              {perf.tasks.map((task, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#dc2626",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "#d1d5db",
                    }}
                  >
                    {task}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 32px",
          borderTop: "1px solid rgba(220,38,38,0.2)",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                color: "#4b5563",
                letterSpacing: "0.12em",
                fontWeight: "600",
              }}
            >
              TOTAL CON IVA ({Math.round(TAX_RATE * 100)}%)
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#f87171",
                lineHeight: 1.1,
              }}
            >
              ${total}
            </div>
          </div>
          <div
            style={{
              width: "1px",
              height: "36px",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "9px",
                color: "#4b5563",
                letterSpacing: "0.12em",
                fontWeight: "600",
              }}
            >
              COMPONENTES
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "white",
                lineHeight: 1.1,
              }}
            >
              {componentCount}
              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "400",
                }}
              >
                /7
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#dc2626",
              fontWeight: "600",
              letterSpacing: "0.05em",
            }}
          >
            twentyseventech.com
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#374151",
              marginTop: "3px",
            }}
          >
            {date}
          </div>
        </div>
      </div>
    </div>
  );
});

BuildBanner.displayName = "BuildBanner";