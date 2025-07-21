'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { toast } from 'react-toastify';

interface QRCodeSectionProps {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  size?: number;
  showDownload?: boolean;
  showCopy?: boolean;
  collapsible?: boolean;
  className?: string;
}

export default function QRCodeSection({
  deviceId,
  deviceName,
  deviceCode,
  size = 150,
  showDownload = true,
  showCopy = true,
  collapsible = false,
  className = ''
}: QRCodeSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      toast.success('Device ID copied to clipboard');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy Device ID');
    }
  };

  const handleDownloadQR = () => {
    try {
      const canvas = document.getElementById(`qr-canvas-${deviceId}`) as HTMLCanvasElement;
      if (!canvas) {
        toast.error('QR code not found');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `QR_${deviceCode}_${deviceName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const qrCodeContent = (
    <div className="flex flex-col items-center space-y-4">
      {/* QR Code */}
      <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
        <QRCodeSVG
          id={`qr-canvas-${deviceId}`}
          value={deviceId}
          size={size}
          level="M"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      {/* Device Info */}
      <div className="text-center space-y-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {deviceCode}
          </p>
        </div>
        
        {/* Device ID Display */}
        <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
          <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
            {deviceId}
          </code>
          {showCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyDeviceId}
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Copy Device ID"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(showDownload || showCopy) && (
        <div className="flex gap-2">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-600" />
              Device QR Code
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {qrCodeContent}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4 text-blue-600" />
          Device QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {qrCodeContent}
      </CardContent>
    </Card>
  );
}