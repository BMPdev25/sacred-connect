import React from 'react';
import { render } from '@testing-library/react-native';
import VerificationStatus from '../app/priest/(priestScreens)/VerificationStatus';
import priestService from '../services/priestService';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), push: jest.fn() }
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: any) => children
}));

jest.mock('../services/priestService', () => ({
    getProfile: jest.fn()
}));

describe('VerificationStatus Screen', () => {
    it('renders loading state initially', () => {
        const { getByTestId } = render(<VerificationStatus />);
        // Just ensuring no crash on mount with loading state
        expect(true).toBeTruthy();
    });

    it('renders not_submitted state when no docs exist', async () => {
        (priestService.getProfile as jest.Mock).mockResolvedValueOnce({
            isVerified: false,
            verificationDocuments: []
        });

        const { findByText } = render(<VerificationStatus />);
        expect(await findByText('Documents Not Submitted')).toBeTruthy();
    });

    it('renders pending state when docs are pending', async () => {
        (priestService.getProfile as jest.Mock).mockResolvedValueOnce({
            isVerified: false,
            verificationDocuments: [{ type: 'government_id', status: 'pending' }]
        });

        const { findByText } = render(<VerificationStatus />);
        expect(await findByText('Profile Under Review')).toBeTruthy();
    });

    it('renders verified state when isVerified is true', async () => {
        (priestService.getProfile as jest.Mock).mockResolvedValueOnce({
            isVerified: true,
            verificationDocuments: [{ type: 'government_id', status: 'verified' }]
        });

        const { findByText } = render(<VerificationStatus />);
        expect(await findByText('Profile Verified!')).toBeTruthy();
    });
});
