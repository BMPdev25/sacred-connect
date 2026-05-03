import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Stack, router } from 'expo-router';
import { APP_COLORS } from '../../constants/Colors';
import devoteeService from '../../services/devoteeService';
import { Ionicons } from '@expo/vector-icons';

const FestivalsCalendar = () => {
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchFestivals = async () => {
      setLoading(true);
      try {
        const data = await devoteeService.getFestivals();
        setFestivals(data);
        
        // Format for react-native-calendars
        const marks: any = {};
        data.forEach((f: any) => {
          if (f.date) {
            marks[f.date] = { 
              marked: true, 
              dotColor: APP_COLORS.maroon,
              customStyles: {
                container: {
                  backgroundColor: APP_COLORS.saffronLight,
                  borderRadius: 8
                },
                text: {
                  color: APP_COLORS.maroon,
                  fontWeight: 'bold'
                }
              }
            };
          }
        });
        
        // Ensure today is highlighted
        const today = new Date().toISOString().split('T')[0];
        if (!marks[today]) {
           marks[today] = { selected: true, selectedColor: APP_COLORS.primary };
        } else {
           marks[today].selected = true;
           marks[today].selectedColor = APP_COLORS.primary;
        }

        setMarkedDates(marks);
      } catch (error) {
        console.error("Failed to fetch festivals", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFestivals();
  }, []);

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    const newMarks = { ...markedDates };
    
    // Clear previous non-festival selection
    Object.keys(newMarks).forEach(key => {
       if (newMarks[key].selected && newMarks[key].selectedColor === APP_COLORS.tertiary) {
           delete newMarks[key].selected;
           delete newMarks[key].selectedColor;
       }
    });

    if (newMarks[day.dateString]) {
       newMarks[day.dateString].selected = true;
    } else {
       newMarks[day.dateString] = { selected: true, selectedColor: APP_COLORS.tertiary };
    }
    
    setMarkedDates(newMarks);
  };

  const festivalsOnSelectedDate = festivals.filter(f => f.date === selectedDate);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
          title: "Hindu Festivals", 
          headerStyle: { backgroundColor: APP_COLORS.neutral },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'serif', fontWeight: 'bold' }
      }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.saffron} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: APP_COLORS.surface,
              calendarBackground: APP_COLORS.surface,
              textSectionTitleColor: APP_COLORS.gray,
              selectedDayBackgroundColor: APP_COLORS.saffron,
              selectedDayTextColor: '#ffffff',
              todayTextColor: APP_COLORS.maroon,
              dayTextColor: APP_COLORS.bodyText,
              textDisabledColor: APP_COLORS.lightGray,
              dotColor: APP_COLORS.maroon,
              selectedDotColor: '#ffffff',
              arrowColor: APP_COLORS.saffron,
              monthTextColor: APP_COLORS.tertiary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
            markingType={'custom'}
            markedDates={markedDates}
            onDayPress={onDayPress}
          />
          
          <View style={styles.detailsContainer}>
             <Text style={styles.selectedDateText}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </Text>
             
             {festivalsOnSelectedDate.length > 0 ? (
                 festivalsOnSelectedDate.map((f, i) => (
                     <View key={i} style={styles.festivalCard}>
                         <View style={styles.festivalIcon}>
                             <Ionicons name="sparkles" size={24} color={APP_COLORS.saffron} />
                         </View>
                         <View style={styles.festivalInfo}>
                             <Text style={styles.festivalName}>{f.name}</Text>
                             <Text style={styles.festivalDesc}>{f.description}</Text>
                         </View>
                     </View>
                 ))
             ) : (
                 <View style={styles.noFestivals}>
                     <Ionicons name="calendar-outline" size={40} color={APP_COLORS.lightGray} />
                     <Text style={styles.noFestivalsText}>No major festivals on this date</Text>
                 </View>
             )}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Ionicons name="information-circle-outline" size={15} color={APP_COLORS.gray} />
            <Text style={styles.disclaimerText}>
              Festival dates are indicative and may vary based on specific traditions, regional calendars, and lunar positioning. Please confirm with your local pandit.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingBottom: 48,
  },
  calendar: {
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    paddingBottom: 10,
    overflow: 'hidden'
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.tertiary,
    marginBottom: 16,
    fontFamily: 'serif'
  },
  festivalCard: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  festivalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: APP_COLORS.saffronLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  festivalInfo: {
    flex: 1,
  },
  festivalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.headingText,
    marginBottom: 4,
  },
  festivalDesc: {
    fontSize: 13,
    color: APP_COLORS.gray,
  },
  bookBtn: {
    backgroundColor: APP_COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noFestivals: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
    borderStyle: 'dashed'
  },
  noFestivalsText: {
    marginTop: 10,
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 28,
    padding: 14,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
  },
  disclaimerText: {
    fontSize: 12,
    color: APP_COLORS.gray,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  }
});

export default FestivalsCalendar;
