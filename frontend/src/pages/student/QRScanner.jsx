import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function QRScanner() {
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    let scanner;
    let isMounted = true;
    let initTimer;
    
    if (status === 'idle') {
      // Debounce initialization to bypass React 18 StrictMode double-fire bug
      initTimer = setTimeout(() => {
        const el = document.getElementById("qr-reader");
        if (el && el.innerHTML) return; // double check

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }
          },
          false
        );

        scanner.render(async (decodedText) => {
          if (!isMounted) return;
          scanner.clear();
          setStatus('scanning');
          try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/qr/mark`, 
              { token: decodedText },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!isMounted) return;
            setStatus('success');
            setMessage(res.data.message);
          } catch (err) {
            if (!isMounted) return;
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to mark attendance');
          }
        }, (error) => {
          // Ignore continuous scan errors
        });
      }, 100);
    }

    return () => {
      isMounted = false;
      if (initTimer) clearTimeout(initTimer);
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [status, token]);

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
            <div id="qr-reader" className="w-full"></div>
          )}

          {status === 'scanning' && (
            <div className="py-12 animate-pulse text-blue-600 font-medium">Processing...</div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <Badge variant="success" className="text-lg py-1 px-4">Attendance Marked</Badge>
              <p className="text-gray-500 text-center">{message}</p>
              <button onClick={resetScanner} className="text-blue-600 hover:underline mt-4">Scan another</button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <Badge variant="danger" className="text-lg py-1 px-4">Scan Failed</Badge>
              <p className="text-red-500 text-center font-medium">{message}</p>
              <button onClick={resetScanner} className="bg-gray-100 text-gray-800 px-4 py-2 rounded mt-4 hover:bg-gray-200">Try Again</button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
