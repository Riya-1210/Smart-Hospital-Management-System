import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { api } from '../lib/api';

interface PrescriptionItem {
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  medicine_name?: string;
  unit_price?: number;
}

interface Prescription {
  prescription_id: number;
  prescription_date: string;
  instructions: string | null;
  patient_name: string;
  doctor_name: string;
  items: PrescriptionItem[];
}

/** Patient's prescriptions — read from the hospital database via /api/prescriptions. */
export default function MyMedicinesPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[] | null>(null);

  useEffect(() => {
    api.get<{ prescriptions: Prescription[] }>('/api/prescriptions')
      .then((res) => setPrescriptions(res.prescriptions))
      .catch(() => setPrescriptions([]));
  }, []);

  const isEmpty = prescriptions !== null && prescriptions.length === 0;

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Pill size={20} className="text-[#78856F]" />
          My Prescriptions
        </h1>
        <p className="page-subtitle">Current medications and dosage schedule</p>
      </div>

      <div className="rounded-lg p-3 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
        <p className="text-sm text-[#9A7535]">
          Always take medicines as prescribed by your doctor. Do not stop or change doses without medical advice.
        </p>
      </div>

      {prescriptions === null ? (
        <div className="text-xs text-[#8C8A83] py-6 text-center">Loading your prescriptions…</div>
      ) : isEmpty ? (
        <div className="card text-xs text-[#5C5A54] py-6 text-center">
          No prescriptions in the hospital database for your account yet. They will appear here once your doctor issues one.
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((pr) => (
            <div key={pr.prescription_id} className="card space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8C8A83]">
                <span className="font-mono">RX-{String(pr.prescription_id).padStart(4, '0')}</span>
                <span>{(pr.prescription_date || '').slice(0, 10)}</span>
              </div>
              {pr.doctor_name && (
                <div className="text-xs text-[#5C5A54]">Prescribed by <span className="font-semibold">{pr.doctor_name.startsWith('Dr') ? pr.doctor_name : `Dr. ${pr.doctor_name}`}</span></div>
              )}
              <div className="space-y-2">
                {pr.items.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#EDE8DE]/60 border border-[#DDE5E1] rounded-lg px-3 py-2">
                    <div className="w-9 h-9 bg-[#EDE8DE] rounded-lg flex items-center justify-center shrink-0">
                      <Pill size={16} className="text-[#78856F]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#292824]">{it.medicine_name || 'Medicine'}</div>
                      <div className="text-xs text-[#5C5A54] mt-0.5">
                        {[it.dosage, it.frequency, it.duration].filter(Boolean).join(' · ') || 'As directed'}
                      </div>
                      {it.instructions && <div className="text-xs text-[#78856F] mt-0.5">{it.instructions}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {pr.instructions && <div className="text-xs text-[#5C5A54] italic">{pr.instructions}</div>}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#8C8A83] italic text-center">
        Data from the hospital database. Always follow your doctor's instructions.
      </p>
    </div>
  );
}
