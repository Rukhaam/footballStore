import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import api from '../services/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- FRONTEND VALIDATION & SANITIZATION ---
  const validateForm = () => {
    const { fullName, email, subject, message } = formData;

    // 1. Name Validation (> 5 characters)
    if (fullName.trim().length <= 5) {
      return "Full Name must be longer than 5 characters.";
    }

    // 2. Email Validation (Regex match)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    // 3. Subject Validation (< 100 characters and not empty)
    if (subject.trim().length < 3) {
      return "Subject must be at least 3 characters long.";
    }
    if (subject.trim().length > 100) {
      return "Subject cannot exceed 100 characters.";
    }

    // 4. Message Validation 
    if (message.trim().length < 10) {
      return "Message is too short. Please provide more details.";
    }
    if (message.trim().length > 1000) {
      return "Message cannot exceed 1000 characters.";
    }

    return null; // Passes all checks!
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run the validator first
    const validationError = validateForm();
    if (validationError) {
      setStatus({ loading: false, success: false, error: validationError });
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    // Sanitize the data (remove extra spaces, standardize email case)
    const sanitizedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      subject: formData.subject.trim(),
      message: formData.message.trim()
    };

    try {
      await api.post('/contact', sanitizedData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ fullName: '', email: '', subject: '', message: '' }); 
      
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus({ loading: false, success: false, error: "Failed to send message. Please try again." });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-base flex items-center pt-10 pb-24 px-6 mt-20">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary/10 rounded-full mb-6 text-brand-primary">
            <MessageSquare size={28} />
          </div>
          <h1 className="kinetic-heading text-5xl md:text-6xl text-white uppercase tracking-wider mb-4">
            Get In <span className="text-brand-primary">Touch</span>
          </h1>
          <p className="text-text-secondary font-inter text-lg max-w-2xl mx-auto">
            Whether you have a question about our latest drops, shipping, or need help with a return, our team is ready to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* LEFT COLUMN: Contact Information */}
          <div className="flex flex-col justify-center items-center gap-10">
            <div className="bg-surface-low border border-white/5 p-3 md:p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32  bg-brand-primary/5 blur-[50px] group-hover:bg-brand-primary/10 transition-colors"></div>
              
              <h3 className="kinetic-heading text-2xl text-white uppercase mb-8">Contact Information</h3>
              
              <div className="flex flex-col gap-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-deep rounded-lg text-brand-primary border border-white/5 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-inter uppercase tracking-widest mb-1">Email Us</h4>
                    <p className="text-text-secondary font-inter">support@kineticarena.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-deep rounded-lg text-brand-primary border border-white/5 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-inter uppercase tracking-widest mb-1">Call Us</h4>
                    <p className="text-text-secondary font-inter">+91 9797116244</p>
                    <p className="text-xs text-text-secondary font-inter mt-1">Mon-Fri, 9am - 6pm IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-deep rounded-lg text-brand-primary border border-white/5 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-inter uppercase tracking-widest mb-1">Headquarters</h4>
                    <p className="text-text-secondary font-inter leading-relaxed">
                    90ft Road <br />
                     AhmadNagar <br />
                     Srinagar,190020
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Form */}
          <div className="bg-surface-low border border-white/5 p-8 md:p-10 rounded-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    name="fullName" 
                    maxLength={50} // Native HTML guard
                    value={formData.fullName} 
                    onChange={handleChange} 
                    className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter placeholder:text-white/20" 
                    placeholder="Lionel Messi" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    maxLength={100} // Native HTML guard
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter placeholder:text-white/20" 
                    placeholder="leo@example.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Subject</label>
                <input 
                  required 
                  type="text" 
                  name="subject" 
                  maxLength={100} // Native HTML guard (< 100 constraint)
                  value={formData.subject} 
                  onChange={handleChange} 
                  className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter placeholder:text-white/20" 
                  placeholder="Where is my order?" 
                />
              </div>

              <div>
                <label className="block text-xs font-inter text-text-secondary uppercase tracking-widest mb-2">Message</label>
                <textarea 
                  required 
                  name="message" 
                  maxLength={1000} // Native HTML guard
                  value={formData.message} 
                  onChange={handleChange} 
                  rows="5"
                  className="w-full bg-surface-deep border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter placeholder:text-white/20 resize-none" 
                  placeholder="How can we help you?" 
                ></textarea>
              </div>

              {/* Status Messages */}
              {status.error && <div className="text-red-400 font-inter text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{status.error}</div>}
              {status.success && <div className="text-brand-primary font-inter text-sm bg-brand-primary/10 p-3 rounded-lg border border-brand-primary/20">Message sent successfully! We will get back to you shortly.</div>}

              <button 
                type="submit" 
                disabled={status.loading}
                className="btn-primary w-full py-4 mt-2 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.loading ? 'Sending...' : (
                  <>Send Message <Send size={18} /></>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;