import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import api from '../api';

interface Language {
    _id: string;
    name: string;
    nativeName: string;
    code: string;
    speakersInMillions: number;
    rank: number;
}

interface LanguagePickerProps {
    selectedLanguages: string[];
    onChange: (languageIds: string[]) => void;
    error?: string;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
    selectedLanguages,
    onChange,
    error,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/languages');
            setLanguages(response.data);
        } catch (error) {
            console.error('Error fetching languages:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLanguage = (languageId: string) => {
        if (selectedLanguages.includes(languageId)) {
            onChange(selectedLanguages.filter(id => id !== languageId));
        } else {
            onChange([...selectedLanguages, languageId]);
        }
    };

    const getSelectedLanguageNames = () => {
        if (selectedLanguages.length === 0) return 'Select languages';
        const selected = languages.filter(lang => selectedLanguages.includes(lang._id));
        return selected.map(lang => lang.name).join(', ');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Languages Spoken *</Text>
            <TouchableOpacity
                style={[styles.pickerButton, error ? styles.pickerButtonError : null]}
                onPress={() => setIsVisible(true)}
            >
                <Text
                    style={[
                        styles.pickerButtonText,
                        selectedLanguages.length === 0 && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                >
                    {getSelectedLanguageNames()}
                </Text>
                <View style={styles.iconContainer}>
                    {selectedLanguages.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{selectedLanguages.length}</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-down" size={20} color={APP_COLORS.gray} />
                </View>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={isVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Languages</Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={APP_COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={APP_COLORS.primary} />
                            </View>
                        ) : (
                            <ScrollView style={styles.languageList}>
                                {languages.map((language) => {
                                    const isSelected = selectedLanguages.includes(language._id);
                                    return (
                                        <TouchableOpacity
                                            key={language._id}
                                            style={[
                                                styles.languageItem,
                                                isSelected && styles.languageItemSelected,
                                            ]}
                                            onPress={() => toggleLanguage(language._id)}
                                        >
                                            <View style={styles.languageInfo}>
                                                <Text style={styles.languageName}>{language.name}</Text>
                                                <Text style={styles.languageNative}>
                                                    {language.nativeName}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxSelected,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={16}
                                                        color={APP_COLORS.white}
                                                    />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setIsVisible(false)}
                        >
                            <Text style={styles.doneButtonText}>
                                Done ({selectedLanguages.length} selected)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: APP_COLORS.black,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        backgroundColor: APP_COLORS.white,
    },
    pickerButtonError: {
        borderColor: APP_COLORS.error || '#ff0000',
    },
    pickerButtonText: {
        fontSize: 16,
        color: APP_COLORS.black,
        flex: 1,
    },
    placeholderText: {
        color: APP_COLORS.gray,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        backgroundColor: APP_COLORS.primary,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: APP_COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    errorText: {
        color: APP_COLORS.error || '#ff0000',
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: APP_COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    languageList: {
        maxHeight: 400,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    languageItemSelected: {
        backgroundColor: APP_COLORS.background || '#f5f5f5',
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '500',
        color: APP_COLORS.black,
        marginBottom: 4,
    },
    languageNative: {
        fontSize: 14,
        color: APP_COLORS.gray,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: APP_COLORS.gray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: APP_COLORS.primary,
        borderColor: APP_COLORS.primary,
    },
    doneButton: {
        backgroundColor: APP_COLORS.primary,
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    doneButtonText: {
        color: APP_COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LanguagePicker;
