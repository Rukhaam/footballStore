import { db } from '../config/db.js';
import { contacts } from '../models/schema.js'; 

export const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    await db.insert(contacts).values({ 
      fullName: fullName, 
      email: email, 
      subject: subject, 
      message: message 
    });

    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact Form Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
};