import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFirstName(fullName: string): string {
  if (!fullName) return 'TheBulletinBriefs';
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName || 'TheBulletinBriefs';
}
