import { QRCodeSVG } from 'qrcode.react';

interface QRCodeBoxProps {
  value: string;
}

export function QRCodeBox({ value }: QRCodeBoxProps) {
  return (
    <div className="qr-box">
      <QRCodeSVG value={value} size={180} includeMargin />
      <p className="muted">
        QR de respaldo para abrir la misma URL del NFC.
      </p>
    </div>
  );
}