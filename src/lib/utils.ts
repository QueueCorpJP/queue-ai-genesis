
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a localized string with a specific format
 */
export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {}
) => {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

/**
 * Format a currency value
 */
export const formatCurrency = (value: number) => {
  return formatNumber(value, {
    style: "currency",
    currency: "JPY",
  });
};

/**
 * Format a date to a localized string
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
) => {
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
};

/**
 * Format a date to a relative time string (e.g. "3 days ago")
 */
export const formatRelativeTime = (date: Date | string | number) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 7) {
    return formatDate(d);
  } else if (days > 0) {
    return `${days}日前`;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return "たった今";
  }
};

/**
 * Check if the device is a mobile device
 */
export const isMobile = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints > 0);
};

/**
 * Truncate a string to a specific length
 */
export const truncate = (str: string, length: number) => {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Generate a random ID
 */
export const generateId = (length = 8) => {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
};

/**
 * Delay execution for a specific amount of time
 */
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

