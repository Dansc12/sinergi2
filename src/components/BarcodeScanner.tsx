import React, { useEffect, useRef } from "react";
import Quagga from "quagga";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
            },
          },
          locator: { patchSize: "medium", halfSample: true },
          numOfWorkers: navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4,
          decoder: {
            readers: [
              "ean_reader", // Most common food barcodes
              "upc_reader", // US barcodes
              "code_128_reader", // Sometimes used
            ],
          },
        },
        (err) => {
          if (err) {
            console.error("Quagga init error:", err);
            Quagga.stop();
          } else {
            Quagga.start();
          }
        },
      );

      Quagga.onDetected(handleDetected);
    }

    function handleDetected(result: any) {
      // Stop scanning after first detection
      const code = result.codeResult.code;
      onDetected(code);
      Quagga.stop();
    }

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div
      ref={scannerRef}
      style={{
        position: "relative",
        width: 400,
        height: 300,
        border: "2px solid #333",
        margin: "0 auto",
        background: "#222",
      }}
    >
      <button
        type="button"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: "#fff",
          border: "1px solid #aaa",
          borderRadius: 4,
          padding: "5px 10px",
          cursor: "pointer",
        }}
        onClick={() => {
          Quagga.stop();
          onClose();
        }}
      >
        Close
      </button>
    </div>
  );
};
export default BarcodeScanner;
