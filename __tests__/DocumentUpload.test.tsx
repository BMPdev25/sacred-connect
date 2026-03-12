import React from 'react';
import { render } from '@testing-library/react-native';
import DocumentUpload from '../app/priest/(priestScreens)/DocumentUpload';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), push: jest.fn() }
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: any) => children
}));

jest.mock('../services/priestService', () => ({
    getProfile: jest.fn(() => Promise.resolve({
        verificationDocuments: []
    })),
    uploadDocument: jest.fn()
}));

describe('DocumentUpload Screen', () => {
    it('renders correctly', async () => {
        const { findByText } = render(<DocumentUpload />);
        expect(await findByText('Upload Documents')).toBeTruthy();
        expect(await findByText('Aadhaar / Government ID')).toBeTruthy();
        expect(await findByText('Vedapatashala Certificate')).toBeTruthy();
    });
});
