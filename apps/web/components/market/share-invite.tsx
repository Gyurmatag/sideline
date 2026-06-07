"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ShareInvite({
  eventSlug,
  accent,
}: {
  eventSlug: string;
  accent?: string;
}) {
  const [url, setUrl] = useState(`/e/${eventSlug}`);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/e/${eventSlug}`);
    }
  }, [eventSlug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the field is selectable as a fallback.
    }
  }

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${eventSlug}-sideline-qr.png`;
    link.click();
  }

  const fg = accent && HEX.test(accent) ? accent : "#111827";

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <QrCode className="size-4" /> Invite attendees
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Scan the code or share the link — attendees join instantly with play
          money, no signup.
        </p>

        <div
          ref={wrapRef}
          className="flex justify-center rounded-xl border border-border/60 bg-white p-4"
        >
          <QRCodeCanvas
            value={url}
            size={176}
            level="M"
            marginSize={1}
            fgColor={fg}
            bgColor="#ffffff"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-xs"
            aria-label="Event link"
          />
          <Button
            size="icon-sm"
            variant="outline"
            onClick={copy}
            aria-label="Copy event link"
          >
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={copy}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={download}
          >
            <Download className="size-3.5" /> Save QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
