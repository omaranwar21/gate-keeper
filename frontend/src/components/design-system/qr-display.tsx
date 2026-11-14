"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function QrDisplay({
  value,
  fileName,
  size = 232,
}: {
  value: string;
  fileName: string;
  size?: number;
}) {
  const t = useTranslations("passes");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // navigator.share with files isn't supported everywhere (e.g. most desktop
  // browsers), so only show the Share button once we know the API is there.
  // Lazy-initialized (not an effect) since it's a pure, one-time capability
  // check with no reactive dependency.
  const [canShare] = useState(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File([], "x.png", { type: "image/png" })] }),
  );

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // navigator.share must run synchronously within the click's user-gesture
    // window (Safari/iOS enforce this strictly) — canvas.toBlob()'s callback
    // fires async and loses that window, so build the Blob synchronously from
    // the data URL instead of awaiting toBlob.
    const file = new File([dataUrlToBlob(canvas.toDataURL("image/png"))], `${fileName}.png`, {
      type: "image/png",
    });
    navigator.share({ files: [file] }).catch(() => {
      // Share sheet dismissed — nothing to do.
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <QRCodeCanvas ref={canvasRef} value={value} size={size} level="M" marginSize={0} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="size-3.5" />
          {t("downloadQr")}
        </Button>
        {canShare && (
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="size-3.5" />
            {t("shareQr")}
          </Button>
        )}
      </div>
    </div>
  );
}
