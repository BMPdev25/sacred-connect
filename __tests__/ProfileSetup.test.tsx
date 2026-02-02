import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileSetup from '../app/(priestScreens)/ProfileSetup';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import priestReducer from '../redux/slices/priestSlice';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ isEditing: 'true', section: 'personalDetails' }),
    router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('../services/priestService', () => ({
    getProfile: jest.fn(() => Promise.resolve({})),
    uploadDocument: jest.fn(() => Promise.resolve()),
    updateProfile: jest.fn(() => Promise.resolve()),
    getProfileCompletion: jest.fn(() => Promise.resolve({ completionPercentage: 50 })),
}));

jest.mock('../api', () => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../api/ceremonyService', () => ({
    getAllCeremonies: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

// Mock simple components that might cause issues
jest.mock('../components/LanguagePicker', () => 'LanguagePicker');

// Create a mock store
const createTestStore = () => {
    return configureStore({
        reducer: {
            auth: authReducer,
            priest: priestReducer,
        },
        preloadedState: {
            auth: {
                userInfo: { name: 'Test Priest', email: 'test@example.com' },
            },
            priest: {},
        },
    });
};

describe('ProfileSetup Screen', () => {
    let store;

    beforeEach(() => {
        store = createTestStore();
        jest.clearAllMocks();
    });

    it('renders Profile Picture upload button', async () => {
        const { getByText } = render(
            <Provider store={store}>
                <ProfileSetup />
            </Provider>
        );

        await waitFor(() => {
            // Check for the text inside the button
            expect(getByText('Upload Photo')).toBeTruthy();
        });
    });

    //   it('triggers ImagePicker when upload button is pressed', async () => {
    //     (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    //     (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
    //       canceled: false,
    //       assets: [{ uri: 'file://test.jpg' }],
    //     });
    //
    //     const { getByText } = render(
    //       <Provider store={store}>
    //         <ProfileSetup />
    //       </Provider>
    //     );
    //
    //     await waitFor(() => {
    //       const uploadBtn = getByText('Upload Photo');
    //       fireEvent.press(uploadBtn);
    //     });
    //
    //     await waitFor(() => {
    //       expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    //     });
    //   });

    it('renders Location update button', async () => {
        const { getByText } = render(
            <Provider store={store}>
                <ProfileSetup />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('Update Location')).toBeTruthy();
        });
    });
});
