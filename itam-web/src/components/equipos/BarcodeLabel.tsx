"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "react-qr-code";

export function BarcodeLabel({ codigo, codigoBarras, categoria }: { codigo: string; codigoBarras: string; categoria: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        JsBarcode(ref.current, codigoBarras, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch {}
    }
  }, [codigoBarras]);

  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(document.getElementById("label-print")?.outerHTML ?? "");
    w.document.close();
    w.print();
  }

  return (
    <div className="space-y-3">
      <div id="label-print" className="border rounded-lg p-4 bg-white w-72 mx-auto">
        <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">INVENTARIO PATRIMONIAL TI</div>
        <div className="text-center text-sm font-bold mt-1">{categoria}</div>
        <div className="flex justify-center mt-2">
          <QRCode value={codigoBarras} size={80} />
        </div>
        <div className="text-center mt-2 font-mono text-xs font-bold">{codigo}</div>
        <div className="flex justify-center mt-2">
          <svg ref={ref} />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={print} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Imprimir etiqueta</button>
      </div>
    </div>
  );
}