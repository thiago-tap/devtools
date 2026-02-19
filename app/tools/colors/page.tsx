"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { parseColor, getContrastRatio } from "@/lib/tools/colors";

export default function ColorsPage() {
  const [hex, setHex] = useState("#6366f1");
  const colors = parseColor(hex);
  const contrastWhite = colors ? getContrastRatio(hex, "#ffffff") : 0;
  const contrastBlack = colors ? getContrastRatio(hex, "#000000") : 0;

  const wcagLevel = (ratio: number) => {
    if (ratio >= 7) return { label: "AAA", color: "text-green-400" };
    if (ratio >= 4.5) return { label: "AA", color: "text-green-400" };
    if (ratio >= 3) return { label: "AA Large", color: "text-yellow-400" };
    return { label: "Fail", color: "text-red-400" };
  };

  return (
    <ToolLayout title="Conversor de Cores" description="Converta entre HEX, RGB, HSL, HSV e CMYK com preview e verificação de contraste">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Picker */}
        <Panel title="Color Picker">
          <div className="space-y-4">
            <div
              className="w-full h-40 rounded-lg border transition-colors"
              style={{ backgroundColor: hex }}
            />
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#6366f1"
                className="font-mono uppercase"
              />
            </div>
          </div>
        </Panel>

        {/* Formats */}
        {colors && (
          <Panel title="Formatos">
            <div className="space-y-3">
              {[
                { label: "HEX", value: colors.hex.toUpperCase() },
                { label: "RGB", value: `rgb(${colors.rgb.r}, ${colors.rgb.g}, ${colors.rgb.b})` },
                { label: "HSL", value: `hsl(${colors.hsl.h}, ${colors.hsl.s}%, ${colors.hsl.l}%)` },
                { label: "HSV", value: `hsv(${colors.hsv.h}, ${colors.hsv.s}%, ${colors.hsv.v}%)` },
                { label: "CMYK", value: `cmyk(${colors.cmyk.c}%, ${colors.cmyk.m}%, ${colors.cmyk.y}%, ${colors.cmyk.k}%)` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground w-12">{label}</span>
                  <code className="text-sm font-mono flex-1">{value}</code>
                  <CopyButton text={value} size="icon" />
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Contrast */}
        {colors && (
          <Panel title="Contraste WCAG">
            <div className="space-y-4">
              {[
                { bg: "#ffffff", label: "Fundo Branco", ratio: contrastWhite },
                { bg: "#000000", label: "Fundo Preto", ratio: contrastBlack },
              ].map(({ bg, label, ratio }) => {
                const level = wcagLevel(ratio);
                return (
                  <div key={bg} className="rounded-lg p-4" style={{ backgroundColor: bg }}>
                    <p className="text-sm font-medium" style={{ color: hex }}>{label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: hex }}>Ratio: {ratio.toFixed(2)}:1</span>
                      <span className={`text-xs font-bold ${level.color}`}>{level.label}</span>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                WCAG AA requer 4.5:1 para texto normal, AAA requer 7:1.
              </p>
            </div>
          </Panel>
        )}
      </div>
    </ToolLayout>
  );
}
