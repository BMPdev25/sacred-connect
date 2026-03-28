import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { APP_COLORS } from "../../../constants/Colors";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";
import { getImageUri } from "../../../utils/imageUtils";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useExplorePujas } from "../../../hooks/useExplorePujas";

const ExploreScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const {
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        categories,
        ceremonies,
        isLoading,
        isError,
        handleRetry,
    } = useExplorePujas();

    const renderServiceCard = ({ item }: { item: any }) => (
        <Card className="mb-3 p-0 overflow-hidden">
            <View className="flex-row">
                <Image
                    source={{ uri: getImageUri(item.image || (item.images && item.images[0])) }}
                    className="w-24 h-30"
                    style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                    resizeMode="cover"
                />
                <View className="flex-1 p-3 justify-between">
                    <Text className="text-sm font-bold text-[#1A1A1A] mb-1" numberOfLines={2}>{item.name}</Text>
                    <View className="flex-row items-center gap-1 mb-0.5">
                        <Ionicons name="star" size={13} color="#FFD700" />
                        <Text className="text-xs font-semibold text-[#4A4A4A]">{item.rating?.average?.toFixed(1) || "4.5"}</Text>
                        <Text className="text-[11px] text-[#666666]">({item.bookingsCount || 0} booked)</Text>
                    </View>
                    <View className="flex-row items-center gap-1 mb-0.5">
                        <Ionicons name="time-outline" size={13} color="#666666" />
                        <Text className="text-xs text-[#666666]">
                            {typeof item.duration === 'object' ? (item.duration.typical || item.duration.minimum) : item.duration} mins
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-1">
                        <Text className="text-lg font-extrabold text-[#1A1A1A]">₹{item.pricing?.basePrice || item.basePrice || "0"}</Text>
                        <PrimaryButton
                            title="Select"
                            onPress={() => router.push(`/(devoteeScreens)/(pujas)/${item._id}`)}
                            size="sm"
                            className="py-1.5 px-3.5 rounded-xl"
                        />
                    </View>
                </View>
            </View>
        </Card>
    );

    return (
        <View 
            className="flex-1 bg-white self-center w-full" 
            style={{ 
                paddingTop: insets.top,
                maxWidth: Platform.OS === 'web' ? 600 : undefined 
            }}
        >
            <StatusBar style="dark" />

            {/* ── Search Bar ──────────────────────────────── */}
            <View className="px-4 py-3 bg-white border-b border-[#E0E0E0]">
                <View className="flex-row items-center bg-[#F5F5F5] rounded-2xl px-3.5 py-2.5">
                    <Ionicons name="search" size={20} color="#666666" />
                    <TextInput
                        className="flex-1 ml-2.5 text-sm text-[#4A4A4A]"
                        placeholder="Search for 'Griha Pravesh'..."
                        placeholderTextColor="#666666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#666666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Body: Sidebar + Main Content ──────────── */}
            <View className="flex-1 flex-row">
                {/* Sidebar */}
                <ScrollView
                    className="w-18 flex-none bg-white border-r border-[#E0E0E0]"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8 }}
                >
                    <TouchableOpacity
                        className={`items-center py-3.5 px-1 relative ${activeCategory === "all" ? 'bg-[#FFF2E0]' : ''}`}
                        onPress={() => setActiveCategory("all")}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="apps"
                            size={20}
                            color={activeCategory === "all" ? '#FF9800' : '#666666'}
                        />
                        <Text
                            className={`text-[10px] mt-1 text-center ${activeCategory === "all" ? 'text-[#FF9800] font-bold' : 'text-[#666666] font-medium'}`}
                            numberOfLines={1}
                        >
                            All
                        </Text>
                        {activeCategory === "all" && <View className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#FF9800] rounded-r" />}
                    </TouchableOpacity>

                    {categories.map((cat: any, index: number) => {
                        const categoryId = cat.slug || cat._id || cat.id || `cat-${index}`;
                        const isActive = activeCategory === categoryId;
                        return (
                            <TouchableOpacity
                                key={`category-${categoryId}-${index}`}
                                className={`items-center py-3.5 px-1 relative ${isActive ? 'bg-[#FFF2E0]' : ''}`}
                                onPress={() => setActiveCategory(categoryId)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={(cat.icon || "flower") as any}
                                    size={20}
                                    color={isActive ? '#FF9800' : '#666666'}
                                />
                                <Text
                                    className={`text-[10px] mt-1 text-center ${isActive ? 'text-[#FF9800] font-bold' : 'text-[#666666] font-medium'}`}
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>
                                {isActive && <View className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#FF9800] rounded-r" />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Main Content */}
                {isError ? (
                    <View className="flex-1 justify-center items-center p-4">
                        <ErrorMessage 
                            message="Failed to load ceremonies. Please check your connection." 
                            showRetry 
                            onRetry={handleRetry} 
                        />
                    </View>
                ) : isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <LoadingSpinner text="Finding sacred services..." />
                    </View>
                ) : (
                    <FlatList
                        data={ceremonies}
                        renderItem={renderServiceCard}
                        keyExtractor={(item, index) => item._id || item.id || index.toString()}
                        className="flex-1"
                        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="items-center justify-center pt-14 gap-2">
                                <Ionicons name="search-outline" size={48} color="#E0E0E0" />
                                <Text className="text-base font-bold text-[#4A4A4A]">No services found</Text>
                                <Text className="text-sm text-[#666666]">Try a different category or search term</Text>
                            </View>
                        }
                    />
                )}

            </View>
        </View>
    );
};

export default ExploreScreen;
