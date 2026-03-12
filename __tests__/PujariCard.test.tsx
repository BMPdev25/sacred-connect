import React from 'react';
import { render } from '@testing-library/react-native';
import PujariCard from '../components/PujariCard';

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
    router: { push: jest.fn() }
}));

describe('PujariCard', () => {
    const mockPujari = {
        _id: '123',
        name: 'Test Priest',
        languages: ['English', 'Hindi'],
        rating: {
            average: 4.5,
            count: 10,
        },
        distance: 2.5,
        ceremonyCount: 15, // the new field we added
    };

    it('renders priest name and rating correctly', () => {
        const { getByText } = render(<PujariCard pujari={mockPujari as any} />);
        expect(getByText('Test Priest')).toBeTruthy();
        expect(getByText('4.5')).toBeTruthy();
        expect(getByText('(10)')).toBeTruthy();
        expect(getByText(/English, Hindi/)).toBeTruthy();
    });

    it('renders distance correctly', () => {
        const { getByText } = render(<PujariCard pujari={mockPujari as any} />);
        expect(getByText('2.5 km away')).toBeTruthy();
    });

    it('renders ceremony count correctly', () => {
        const { getByText } = render(<PujariCard pujari={mockPujari as any} />);
        expect(getByText('15 Pujas Completed')).toBeTruthy();
    });

    it('does not render ceremony count if undefined', () => {
        const noCountPujari = { ...mockPujari, ceremonyCount: undefined };
        const { queryByText } = render(<PujariCard pujari={noCountPujari as any} />);
        expect(queryByText(/Pujas Completed/)).toBeNull();
    });
});
