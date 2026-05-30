export interface LegalSection {
  title: string;
  content: string;
}

export const LAST_UPDATED = 'Last updated: June 2026';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using Sacred Connect, you agree to comply with and be bound by these Terms of Service. Please read them carefully. If you do not agree, you must not use our services.',
  },
  {
    title: 'Use of Services',
    content: 'Sacred Connect provides a marketplace for booking religious ceremony services (pujas) in India. You must be at least 18 years old and capable of forming legally binding contracts under Indian law.',
  },
  {
    title: 'Booking and Payments',
    content: 'All ceremony bookings are subject to priest availability and confirmation. Payments are processed securely via Razorpay. Prices listed include all applicable service fees and materials, if specified.',
  },
  {
    title: 'Cancellation Policy',
    content: 'Cancellations made more than 24 hours prior to the scheduled ceremony are eligible for a full refund. Cancellations made within 24 hours of the ceremony start time may incur a cancellation fee.',
  },
  {
    title: 'User Responsibilities',
    content: 'You agree to provide accurate details during booking, ensure a safe environment for the pandit at the venue, and prepare any materials required for the ceremony as coordinated prior to the event.',
  },
  {
    title: 'Limitation of Liability',
    content: 'Sacred Connect acts as a booking marketplace and is not liable for the quality of performance, conduct, or any disputes arising directly between the devotee and the booked priest.',
  },
  {
    title: 'Contact Information',
    content: 'For any questions or concerns regarding these terms, please contact our legal team at legal@sacredconnect.in.',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Information We Collect',
    content: 'We collect personal information that you provide to us, including your name, email address, phone number, saved addresses, and booking details necessary to coordinate religious ceremonies.',
  },
  {
    title: 'How We Use Your Information',
    content: 'Your information is used to facilitate bookings, process payments via Razorpay, send notifications, and improve our services. Location services are used optionally to find nearby pandits.',
  },
  {
    title: 'Data Sharing',
    content: 'We do not sell your personal data. We share necessary details (name, contact, address) only with the specific priest assigned to conduct your booking, and with secure service providers like Razorpay.',
  },
  {
    title: 'Data Security',
    content: 'We employ industry-standard technical and organizational measures to safeguard your personal data against unauthorized access, loss, alteration, or misuse.',
  },
  {
    title: 'Your Rights',
    content: 'Under applicable data protection laws, you have the right to access, update, correct, or request deletion of your personal information stored in our databases at any time.',
  },
  {
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy or how we handle your personal data, please contact our privacy officer at privacy@sacredconnect.in.',
  },
];
