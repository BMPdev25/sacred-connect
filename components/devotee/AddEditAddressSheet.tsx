import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { THEME } from '@/constants/theme';
import { DevoteeAddress } from '@/types/booking.types';
import { AddressForm } from './profile/AddressForm';

export interface AddEditAddressSheetProps {
  /** Visibility trigger of the sheet */
  isVisible: boolean;
  /** Fired when requesting sheet closure */
  onClose: () => void;
  /** Existing address to pre-fill the form, or null for a new address */
  existingAddress: DevoteeAddress | null;
  /** Callback triggered after a successful save operation */
  onSaved: (address: DevoteeAddress) => void;
  /** Mode modifier to render either as slide-up sheet or full overlay */
  isBottomSheet?: boolean;
}

function renderBackdrop(props: BottomSheetBackdropProps): React.JSX.Element {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />;
}

/**
 * Slide-up bottom sheet panel for editing/saving devotee profile addresses.
 */
export default function AddEditAddressSheet({
  isVisible,
  onClose,
  existingAddress,
  onSaved,
  isBottomSheet = true,
}: AddEditAddressSheetProps): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);

  React.useEffect(() => {
    if (isBottomSheet) {
      if (isVisible) {
        sheetRef.current?.expand();
      } else {
        sheetRef.current?.close();
      }
    }
  }, [isVisible, isBottomSheet]);

  if (!isVisible) {
    return null;
  }

  if (!isBottomSheet) {
    return (
      <View style={styles.fullScreenOverlay}>
        <KeyboardAwareScrollView
          style={styles.fullScrollView}
          contentContainerStyle={styles.fullScrollContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={80}
        >
          <AddressForm
            existingAddress={existingAddress}
            onSaved={onSaved}
            onClose={onClose}
            isVisible={isVisible}
          />
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
    >
      <BottomSheetScrollView
        style={styles.sheetScrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AddressForm
          existingAddress={existingAddress}
          onSaved={onSaved}
          onClose={onClose}
          isVisible={isVisible}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: THEME.colors.surface,
  },
  handle: {
    backgroundColor: THEME.colors.border,
  },
  sheetScrollView: {
    flex: 1,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.background,
    zIndex: 100,
  },
  fullScrollView: {
    flex: 1,
  },
  fullScrollContent: {
    paddingBottom: 120,
  },
});
