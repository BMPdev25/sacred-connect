import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileSetup from '../app/priest/(priestScreens)/ProfileSetup';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import priestReducer from '../redux/slices/priestSlice';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

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

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
    readAsStringAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
    documentDirectory: 'test-directory/',
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
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
                userInfo: { name: 'Test Priest', email: 'test@example.com', phone: '1234567890', userType: 'priest', token: 'mock-token' } as any,
                userToken: 'mock-token',
                isLoading: false,
                error: null,
            },
            priest: {
                profile: null,
                bookings: [],
                earnings: null,
                isLoading: false,
                error: null,
            },
        },
    });
};

describe('ProfileSetup Screen', () => {
    let store: ReturnType<typeof createTestStore>;

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
            expect(getByText('Upload Profile Photo')).toBeTruthy();
        });
    });

    it('renders Personal Details section', async () => {
        const { getByText } = render(
            <Provider store={store}>
                <ProfileSetup />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('Years of Experience *')).toBeTruthy();
            expect(getByText('Religious Tradition *')).toBeTruthy();
        });
    });
});
