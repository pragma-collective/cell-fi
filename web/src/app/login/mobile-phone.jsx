'use client';

import { useState } from 'react';
import { z } from 'zod';
import apiClient from '@/lib/axios';
import ErrorMessage from './error-message';

const phoneSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number should only contain numbers"),
});

export default function MobilePhone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submitPhoneNumber = async (phoneNumber) => {
    try {
      const response = await apiClient.post('/auth/login', {
        phoneNumber
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit phone number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      phoneSchema.parse({ phoneNumber });
      setIsLoading(true);
      
      await submitPhoneNumber(phoneNumber);
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p className="text-[var(--color-gray-dark)] mb-5">Enter your phone number to continue.</p>
      <input 
        type="text" 
        className="input input--text" 
        placeholder="Phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        disabled={isLoading}
      />
      <button 
        className="button button--primary"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Continue'} &nbsp;→
      </button>
      {error && <ErrorMessage message={error} />}
    </>
  );
}