"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function CopyButton({ text, className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size={size} onClick={handleCopy} className={className}>
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      {size !== "icon" && <span>{copied ? "Copiado!" : "Copiar"}</span>}
    </Button>
  );
}
