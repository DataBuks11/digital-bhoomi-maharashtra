import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Indian Currency (e.g. ₹ 1,45,000)
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format Maharashtra Land Area (Hectare - Are - Sq. Meters)
export function formatLandArea(hectares: number, are: number, sqMeters?: number): string {
  return `${hectares} Hectare ${are} Are ${sqMeters ? `(${sqMeters.toLocaleString('en-IN')} sq.m)` : ''}`;
}

// Format Date in DD/MM/YYYY or Indian standard
export function formatDateIndian(dateStr?: string | Date): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.toString();
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Generate realistic ULPIN (Bhu-Aadhaar 14-digit alphanumeric)
export function generateULPIN(stateCode: string = 'MH', districtCode: string = 'PUN'): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 9; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${stateCode}${districtCode}${rand}`;
}
