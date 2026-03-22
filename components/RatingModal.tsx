import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors'; // Assuming this exists
import { PRIEST_TAGS, DEVOTEE_TAGS } from '../constants/RatingTags';

interface RatingModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string, tags: string[]) => Promise<void>;
    role: 'priest' | 'devotee'; // Current user's role
    bookingDetails?: {
        ceremonyType: string;
        date: string;
        clientName: string;
    };
}

const RatingModal: React.FC<RatingModalProps> = ({ isVisible, onClose, onSubmit, role, bookingDetails }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableTags = role === 'priest' ? DEVOTEE_TAGS : PRIEST_TAGS; // If I am a priest, I rate the devotee

    const handleTagToggle = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment, selectedTags);
            setRating(0);
            setComment('');
            setSelectedTags([]);
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Rate your Experience</Text>
                            {bookingDetails && (
                                <Text style={styles.subtitle}>
                                    {bookingDetails.ceremonyType} with {bookingDetails.clientName} • {new Date(bookingDetails.date).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Star Rating */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={40}
                                        color={star <= rating ? "#FFD700" : "#CCC"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.ratingText}>
                            {rating === 0 ? 'Tap to Rate' : `${rating}.0 Stars`}
                        </Text>

                        {/* Tags */}
                        <Text style={styles.sectionTitle}>What went well?</Text>
                        <View style={styles.tagsContainer}>
                            {availableTags.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tag,
                                        selectedTags.includes(tag) && styles.selectedTag
                                    ]}
                                    onPress={() => handleTagToggle(tag)}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        selectedTags.includes(tag) && styles.selectedTagText
                                    ]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Comment */}
                        <Text style={styles.sectionTitle}>Review (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Share your experience..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Review</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        width: Platform.OS === 'web' ? '100%' : undefined,
        maxWidth: Platform.OS === 'web' ? 500 : undefined,
        alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    content: {
        padding: 20,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        gap: 10,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 25,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#444',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 25,
    },
    tag: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedTag: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    tagText: {
        fontSize: 14,
        color: '#666',
    },
    selectedTagText: {
        color: '#FFF',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#FF6B00',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#FFB380',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RatingModal;
