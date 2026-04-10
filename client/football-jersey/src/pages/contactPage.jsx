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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    try {
      await api.post('/contact', formData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ fullName: '', email: '', subject: '', message: '' }); // Clear form
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus({ loading: false, success: false, error: "Failed to send message. Please try again." });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-base flex items-center pt-10 pb-24 px-6">
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
          <div className="flex flex-col gap-10">
            <div className="bg-surface-low border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[50px] group-hover:bg-brand-primary/10 transition-colors"></div>
              
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
                    <p className="text-text-secondary font-inter">+1 (800) 123-KINETIC</p>
                    <p className="text-xs text-text-secondary font-inter mt-1">Mon-Fri, 9am - 6pm EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-deep rounded-lg text-brand-primary border border-white/5 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-inter uppercase tracking-widest mb-1">Headquarters</h4>
                    <p className="text-text-secondary font-inter leading-relaxed">
                      100 Kinetic Ave, Suite 300<br />
                      Stadium District, Neo City<br />
                      NY 10001
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