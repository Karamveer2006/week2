import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle2, XCircle, Camera } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function QRScanner() {
  const [status, setStatus] = useState('idle'); // idle, active, scanning, success, error
  const [message, setMessage] = useState('');
  const { token } = useAuth();
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setStatus('active');
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // On success read
          if (html5QrCodeRef.current?.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          setStatus('scanning');
          try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/qr/mark`, 
              { token: decodedText },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setStatus('success');
            setMessage(res.data.message);
          } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to mark attendance');
          }
        },
        (errorMessage) => {
          // ignore continuous scan errors
        }
      );
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage("Failed to access camera. Please ensure permissions are granted.");
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="flex justify-center mt-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          
          {status === 'idle' && (
            <div className="flex flex-col items-center py-8 space-y-6">
              <div className="p-6 bg-blue-50 rounded-full text-blue-500">
                <Camera size={48} />
              </div>
              <p className="text-center text-gray-600 px-4">
                Click below to grant camera permission and scan the class QR code.
              </p>
              <Button onClick={startScanner} size="lg" className="w-full">
                Start Scanning
              </Button>
            </div>
          )}

          <div id="qr-reader" className={`w-full ${status === 'active' ? 'block' : 'hidden'}`}></div>

          {status === 'scanning' && (
            <div className="flex flex-col items-center py-12 space-y-4">
              <Button isLoading={true} variant="ghost" className="text-blue-600 pointer-events-none text-lg">
                Processing Attendance...
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <Badge variant="success" className="text-lg py-1 px-4">Attendance Marked</Badge>
              <p className="text-gray-500 text-center">{message}</p>
              <Button onClick={resetScanner} variant="outline" className="mt-4">
                Scan another
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <Badge variant="danger" className="text-lg py-1 px-4">Scan Failed</Badge>
              <p className="text-red-500 text-center font-medium">{message}</p>
              <Button onClick={resetScanner} variant="secondary" className="mt-4">
                Try Again
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
