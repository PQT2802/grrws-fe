import { QRCodeSVG } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import React from 'react';

export interface DeviceQRExport {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  qrCodeDataUrl: string;
}

export const generateDeviceQRCode = (deviceId: string, size: number = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container that's visible but positioned off-screen
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = `${size}px`;
      container.style.height = `${size}px`;
      container.style.backgroundColor = 'white';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);

      // Create React root and render QR code
      const root = createRoot(container);
      
      const QRComponent = React.createElement(QRCodeSVG, {
        value: deviceId,
        size: size,
        level: 'M',
        includeMargin: true,
        fgColor: '#000000',
        bgColor: '#ffffff',
        id: `temp-qr-${Date.now()}-${Math.random()}`
      });

      root.render(QRComponent);

      // Use requestAnimationFrame to ensure DOM rendering is complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            const svgElement = container.querySelector('svg');
            if (!svgElement) {
              throw new Error('SVG element not found');
            }

            // Create a new canvas for conversion
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Canvas context not available');
            }

            canvas.width = size;
            canvas.height = size;

            // Convert SVG to image using alternative method
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
            const imgSrc = `data:image/svg+xml;base64,${svgBase64}`;

            const img = new Image();
            img.onload = () => {
              try {
                // Fill white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw QR code
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                
                // Cleanup
                root.unmount();
                document.body.removeChild(container);
                
                resolve(dataUrl);
              } catch (error) {
                root.unmount();
                document.body.removeChild(container);
                reject(new Error(`Failed to draw QR code: ${error instanceof Error ? error.message : String(error)}`));
              }
            };

            img.onerror = (error) => {
              root.unmount();
              document.body.removeChild(container);
              reject(new Error('Failed to load SVG as image'));
            };

            img.src = imgSrc;
          } catch (error) {
            root.unmount();
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
            reject(error);
          }
        }, 150); // Increased delay to ensure rendering
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Add batch generation with better error handling
export const generateBatchQRCodes = async (
  devices: any[], 
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<DeviceQRExport[]> => {
  const results: DeviceQRExport[] = [];
  const total = devices.length;
  
  console.log(`Starting batch QR generation for ${total} devices`);
  
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    try {
      if (onProgress) {
        onProgress(Math.round(((i) / total) * 100), i + 1, total);
      }
      
      const qrCodeDataUrl = await generateDeviceQRCode(device.id, 120);
      results.push({
        deviceId: device.id,
        deviceName: device.deviceName,
        deviceCode: device.deviceCode,
        qrCodeDataUrl
      });
      
      console.log(`✅ QR code generated for device ${i + 1}/${total}: ${device.deviceCode}`);
      
      // Small delay to prevent overwhelming the browser
      if (i < devices.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error(`❌ Failed to generate QR code for device ${device.deviceCode}:`, error);
      // Continue with other devices, but include device without QR
      results.push({
        deviceId: device.id,
        deviceName: device.deviceName,
        deviceCode: device.deviceCode,
        qrCodeDataUrl: ''
      });
    }
  }
  
  if (onProgress) {
    onProgress(100, total, total);
  }
  
  console.log(`✅ Batch QR generation completed: ${results.filter(r => r.qrCodeDataUrl).length}/${total} successful`);
  return results;
};

// Keep other utility functions...
export const prepareDevicesForQRExport = async (devices: any[]): Promise<DeviceQRExport[]> => {
  return generateBatchQRCodes(devices);
};

export const downloadQRCode = async (deviceId: string, deviceCode: string, deviceName: string, size: number = 200): Promise<void> => {
  try {
    const dataUrl = await generateDeviceQRCode(deviceId, size);
    
    const link = document.createElement('a');
    link.download = `QR_${deviceCode}_${deviceName.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw error;
  }
};