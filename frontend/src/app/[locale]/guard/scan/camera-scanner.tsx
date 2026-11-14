"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const READER_ID = "gatekeeper-camera-reader";

export function CameraScanner({ onScan, disabled }: { onScan: (token: string) => void; disabled?: boolean }) {
  const t = useTranslations("guard");
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function start() {
    setError(false);
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {},
      );
      setActive(true);
    } catch {
      setError(true);
      setActive(false);
    }
  }

  async function stop() {
    try {
      await scannerRef.current?.stop();
    } catch {
      // already stopped
    }
    setActive(false);
  }

  return (
    <div className="space-y-3">
      <div
        id={READER_ID}
        className="mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-navy-950 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t("cameraError")}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant={active ? "outline" : "default"}
        className="w-full"
        onClick={active ? stop : start}
        disabled={disabled}
      >
        {active ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
        {active ? t("cameraStop") : t("cameraStart")}
      </Button>
    </div>
  );
}
