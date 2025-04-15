// src/app/(landing)/contact/_components/ContactForm.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState({
    from_name: '',
    reply_to: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("Ae3931sbnGbelLWSO");
  }, []);

  // Handle input changes - critical for allowing text input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Debug log - remove in production
    console.log(`Field ${name} changing to: ${value}`);
    
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formState.from_name.trim()) return 'Name is required';
    if (!formState.reply_to.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formState.reply_to)) return 'Please enter a valid email';
    if (!formState.subject.trim()) return 'Subject is required';
    if (!formState.message.trim()) return 'Message is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      setFormStatus('error');
      return;
    }

    setFormStatus('submitting');
    setErrorMessage('');

    try {
      // EmailJS configuration
      const serviceId = 'service_gxu87jv';
      const templateId = 'template_myk70qs';
      const publicKey = 'Ae3931sbnGbelLWSO';
      
      // Log form data before sending
      console.log("Sending form data:", formState);
      
      // Send email using EmailJS
      if (formRef.current) {
        await emailjs.sendForm(
          serviceId,
          templateId,
          formRef.current,
          publicKey
        );
      }

      setFormStatus('success');
      setFormState({
        from_name: '',
        reply_to: '',
        subject: '',
        message: ''
      });
      
      // Reset form status after 5 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
      
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send your message. Please try again later.');
      console.error('Contact form submission error:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
      
      {formStatus === 'success' ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <p className="text-green-700 font-medium">Message sent successfully!</p>
              <p className="text-green-600">We'll get back to you as soon as possible.</p>
            </div>
          </div>
        </div>
      ) : null}
      
      {formStatus === 'error' ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <p className="text-red-700 font-medium">There was an error</p>
              <p className="text-red-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Hidden fields for EmailJS */}
        <input type="hidden" name="recipient_email" value="louisphilippelalou@outlook.com" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="from_name"
              name="from_name"
              value={formState.from_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label htmlFor="reply_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Email
            </label>
            <input
              type="email"
              id="reply_to"
              name="reply_to"
              value={formState.reply_to}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="john@example.com"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formState.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Subject of your message"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formState.message}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="How can we help you?"
          ></textarea>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={formStatus === 'submitting'}
            className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              formStatus === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {formStatus === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}