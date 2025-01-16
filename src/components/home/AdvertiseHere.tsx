"use client";

import { useState } from 'react';

const AdvertiseHere = () => {
  const [copied, setCopied] = useState(false);
  const email = "antiplaylist@humanzzz.com"; // Replace with your actual email

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <button 
      onClick={handleCopyEmail}
      className="bg-zinc-100 text-center w-full h-24 flex items-center justify-center hover:bg-zinc-200 transition-colors"
      aria-label="Copy email address"
    >
      <h3 className="text-xs font-semibold text-zinc-500">
        {copied ? "Email Copied!" : "Advertise Here"}
      </h3>
    </button>
  );
};

export default AdvertiseHere;
