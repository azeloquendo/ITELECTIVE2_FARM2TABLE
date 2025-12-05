import { useState } from 'react';

interface UseContactFormProps {
  endpoint: string;
  onSuccess?: () => void;
}

export function useContactForm({ endpoint, onSuccess }: UseContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const submitForm = async (formData: any) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
        onSuccess?.();
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitSuccess,
    error,
    submitForm,
    setError
  };
}