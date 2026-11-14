"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import { Download, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(value);
    toast.success(t("linkCopied"));
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
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <LinkIcon className="size-3.5" />
          {t("copyLink")}
        </Button>
      </div>
    </div>
  );
}
