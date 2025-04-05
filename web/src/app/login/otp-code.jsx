'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import ErrorMessage from './error-message';
import apiClient from '@/lib/axios';

const otpSchema = z.object({
  otp: z.string().length(6, "Please enter all 6 digits")
});

export default function OTPCode() {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleChange = (index, value) => {
    // Only allow numerical input
    if (!/^\d*$/.test(value)) return;
    
    if (value.length > 1) value = value.slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto focus next input when value is entered
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    console.log(index);

    // Check if all fields are filled and submit
    // if (value !== '' && index === 5) {
    //   const allFilled = newOtpValues.every(v => v !== '');
    //   if (allFilled) {
    //     handleSubmit();
    //   }
    // }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6);
    const newOtpValues = [...otpValues];
    
    pasteData.split('').forEach((char, idx) => {
      if (idx < 6) newOtpValues[idx] = char;
    });
    
    setOtpValues(newOtpValues);
    if (pasteData.length > 0) {
      const focusIndex = Math.min(pasteData.length, 5);
      inputRefs[focusIndex].current.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otpValues.join('');
    try {
      otpSchema.parse({ otp: otpString });
      setError('');
      setIsLoading(true);

      try {
        const response = await apiClient.post('/auth/verify', {
          code: otpString,
          reference: 'd714ac9e-a21b-437c-a014-ac56c338895a',
        });
        
        console.log('OTP verification successful:', response.data);
        // Handle successful verification here
        
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to verify OTP');
      }

    } catch (validationError) {
      setError('Please fill in all OTP digits');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p className="text-[var(--color-gray)]">We sent a code to your registered number *******7634</p>
      <div className="grid grid-cols-6 gap-[10px]">
        {otpValues.map((value, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            className="input--text num"
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={inputRefs[index]}
            maxLength={1}
          />
        ))}
      </div>
      <button 
        className="button button--primary"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? 'Verifying...' : 'Continue'} &nbsp;→
      </button>
      {error && <ErrorMessage message={error} />}
      <p className="text-center text-[var(--color-gray-dark)]">
        Didn't receive the code? <a href="#" className="underline text-[var(--color-gray)]">Click here to resend</a>
      </p>
    </>
  );
}