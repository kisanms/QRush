import { useState, useRef } from "react";
import { Platform, Share, Linking } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export const useQRSharing = (showToast) => {
  const [selectedQRForSharing, setSelectedQRForSharing] = useState(null);
  const shareTemplateRef = useRef(null);

  const handleWebShare = async (qrCode) => {
    try {
      // Import QRCode library for web
      const QRCodeLib = require("qrcode");

      // Create a canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size
      canvas.width = 400;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Header
      ctx.fillStyle = "#7ed321";
      ctx.fillRect(20, 20, canvas.width - 40, 80);

      // Header text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("QRush", canvas.width / 2, 55);

      ctx.font = "14px Arial";
      ctx.fillText("Quick & Easy QR Codes", canvas.width / 2, 80);

      // Create QR code
      const qrCanvas = document.createElement("canvas");
      const qrSize = 200;

      await QRCodeLib.toCanvas(qrCanvas, qrCode.qr_data || qrCode.url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Draw QR code on main canvas
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 120;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // QR Title
      ctx.fillStyle = "#333333";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";

      // Word wrap for title
      const title = qrCode.title;
      const maxWidth = canvas.width - 40;
      const words = title.split(" ");
      let line = "";
      let y = qrY + qrSize + 40;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + " ";
          y += 25;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // URL section
      y += 40;
      ctx.font = "12px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText("Scan to visit:", canvas.width / 2, y);

      y += 20;
      ctx.font = "14px Arial";
      ctx.fillStyle = "#7ed321";

      // Word wrap for URL
      const url = qrCode.url;
      const urlWords =
        url.length > 50
          ? [
              url.substring(0, 25) + "...",
              "..." + url.substring(url.length - 25),
            ]
          : [url];

      for (const urlPart of urlWords) {
        ctx.fillText(urlPart, canvas.width / 2, y);
        y += 20;
      }

      // Footer
      ctx.fillStyle = "#999999";
      ctx.font = "10px Arial";
      ctx.fillText(
        `Generated with QRush • ${new Date().toLocaleDateString()}`,
        canvas.width / 2,
        canvas.height - 30
      );

      // Convert to blob and share/download
      canvas.toBlob(async (blob) => {
        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({
            files: [new File([blob], "qrcode.png", { type: "image/png" })],
          })
        ) {
          // Use Web Share API
          const file = new File([blob], `${qrCode.title || "qrcode"}.png`, {
            type: "image/png",
          });
          await navigator.share({
            title: qrCode.title,
            text: `Check out this QR code: ${qrCode.title}`,
            files: [file],
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${qrCode.title || "qrcode"}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Also copy URL to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(qrCode.url);
            showToast(
              "success",
              "Success",
              "QR code downloaded and URL copied to clipboard"
            );
          } else {
            showToast("success", "Downloaded", "QR code image downloaded");
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("Web share error:", error);
      // Fallback to simple URL sharing
      if (navigator.share) {
        await navigator.share({
          title: qrCode.title,
          text: `Check out this QR code: ${qrCode.title}`,
          url: qrCode.url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(qrCode.url);
        showToast("success", "Copied", "URL copied to clipboard");
      }
    }
  };

  const handleMobileShare = async (qrCode) => {
    try {
      // Capture the shareable template as image
      const uri = await captureRef(shareTemplateRef, {
        format: "png",
        quality: 1.0,
      });

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: qrCode.title,
        UTI: "public.png",
      });
    } catch (error) {
      console.error("Mobile share error:", error);
      // Fallback to URL sharing
      await Share.share({
        message: `${qrCode.title}\n${qrCode.url}`,
        url: qrCode.url,
        title: qrCode.title,
      });
    }
  };

  const handleShare = async (qrCode) => {
    try {
      setSelectedQRForSharing(qrCode);

      if (Platform.OS === "web") {
        await handleWebShare(qrCode);
      } else {
        // Small delay to ensure template renders
        setTimeout(async () => {
          await handleMobileShare(qrCode);
        }, 100);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      showToast("error", "Error", "Failed to share QR code");
    }
  };

  return {
    selectedQRForSharing,
    shareTemplateRef,
    handleShare,
  };
};
