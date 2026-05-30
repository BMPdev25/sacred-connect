import { FAQItem } from '@/types/profile.types';

/**
 * Static set of Frequently Asked Questions (FAQs) for Help & Support screens.
 */
export const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book a pandit?',
    answer:
      'Browse pandits on the Explore tab or search by ceremony type. Tap a pandit\'s profile to view their services, then tap "Book this service" or "Book Now" to start the booking process.',
  },
  {
    id: '2',
    question: 'Can I cancel my booking?',
    answer:
      'Yes. Go to My Bookings, tap the booking you want to cancel, and tap "Cancel Booking". Free cancellation is available up to 24 hours before the ceremony. Late cancellations may be subject to a fee per our cancellation policy.',
  },
  {
    id: '3',
    question: 'When does the pandit get paid?',
    answer:
      'The pandit receives their share after the ceremony is marked as completed. Sacred Connect holds the payment securely and releases it once both parties confirm the ceremony was performed.',
  },
  {
    id: '4',
    question: 'How do I become a verified pandit?',
    answer:
      'Sign up as a Pandit on the registration screen and complete the onboarding steps including profile setup, service pricing, and document verification. Our team reviews applications within 24–48 hours.',
  },
  {
    id: '5',
    question: "What if the pandit doesn't show up?",
    answer:
      'Please contact our support team immediately via Help & Support. We will arrange a replacement pandit or issue a full refund depending on the situation.',
  },
  {
    id: '6',
    question: 'How are prices determined?',
    answer:
      "Each pandit sets their own service prices based on the ceremony type and duration. Sacred Connect adds a 5% platform fee on top of the pandit's price to support the platform. The total is shown clearly before you confirm payment.",
  },
];
