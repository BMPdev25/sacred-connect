/**
 * Sub-components for Step3Services.
 * Extracted to keep the main step file under 200 lines.
 */

import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FORM_COL_WIDTH, PRICE_MAX } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { Ceremony } from '@/services/metadataService';
import { PriestService } from '@/types/priest.types';

// ---------------------------------------------------------------------------
// Types re-exported for the parent component to use
// ---------------------------------------------------------------------------

export interface ServiceFormValues {
  ceremonyId: string;
  ceremonyName: string;
  durationMinutes: number;
  price: string; // kept as string while user types
}

export interface ServiceFormErrors {
  ceremony?: string;
  duration?: string;
  price?: string;
}

// ---------------------------------------------------------------------------
// Pure Helpers
// ---------------------------------------------------------------------------

/**
 * Validates the add/edit service form values.
 * Returns a map of field → error string; empty map means valid.
 */
export function validateServiceForm(values: ServiceFormValues): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  if (!values.ceremonyId) errors.ceremony = 'Select a ceremony';
  if (!values.durationMinutes || values.durationMinutes <= 0) errors.duration = 'Select a duration';
  const priceNum = Number(values.price);
  
  if (!values.price || isNaN(priceNum) || priceNum <= 0) errors.price = 'Enter a valid price';
  else if (priceNum >= PRICE_MAX) errors.price = `Price must be under ₹${PRICE_MAX.toLocaleString('en-IN')}`;
  return errors;
}

/**
 * Builds the updated services array after an add or edit operation.
 */
export function buildUpdatedList(
  services: PriestService[],
  formValues: ServiceFormValues,
  editingIndex: number | null
): PriestService[] {
  const newService: PriestService = {
    ceremonyId: formValues.ceremonyId,
    ceremonyName: formValues.ceremonyName,
    durationMinutes: formValues.durationMinutes,
    price: Number(formValues.price),
  };
  if (editingIndex !== null) {
    return services.map((svc, i) => (i === editingIndex ? newService : svc));
  }
  return [...services, newService];
}

// ---------------------------------------------------------------------------
// ServiceFormCard
// ---------------------------------------------------------------------------

/** Props for ServiceFormCard. */
interface ServiceFormCardProps {
  formValues: ServiceFormValues;
  formErrors: ServiceFormErrors;
  editingIndex: number | null;
  selectedDurationLabel: string;
  onFieldChange: (patch: Partial<ServiceFormValues>) => void;
  onOpenCeremonyModal: () => void;
  onOpenDurationModal: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Inline add/edit form card rendered inside Step 3 when isFormOpen is true.
 * Isolated here to keep Step3Services.tsx under 200 lines.
 */
export function ServiceFormCard({
  formValues, formErrors, editingIndex, selectedDurationLabel,
  onFieldChange, onOpenCeremonyModal, onOpenDurationModal, onCancel, onSave,
}: ServiceFormCardProps): React.ReactElement {
  return (
    <View style={formCardStyles.card}>
      <View style={formCardStyles.header}>
        <Ionicons name="calendar-outline" size={16} color={THEME.colors.primary} />
        <Text style={formCardStyles.title}>{editingIndex !== null ? 'Edit Service' : 'Add Service'}</Text>
      </View>

      <DropdownPicker
        label="Ceremony"
        value={formValues.ceremonyName}
        placeholder="Select Ceremony"
        onPress={onOpenCeremonyModal}
        error={formErrors.ceremony}
      />

      <View style={formCardStyles.row}>
        <DropdownPicker
          label="Duration"
          value={selectedDurationLabel}
          placeholder="Select Duration"
          onPress={onOpenDurationModal}
          error={formErrors.duration}
          style={formCardStyles.col}
        />
        <PriceInput
          value={formValues.price}
          onChangeText={(text) => onFieldChange({ price: text })}
          error={formErrors.price}
          style={formCardStyles.col}
        />
      </View>

      <View style={formCardStyles.row}>
        <TouchableOpacity style={[formCardStyles.actionBtn, formCardStyles.cancelBtn]} onPress={onCancel}>
          <Text style={formCardStyles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[formCardStyles.actionBtn, formCardStyles.saveBtn]} onPress={onSave}>
          <Text style={formCardStyles.saveBtnText}>{editingIndex !== null ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formCardStyles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    gap: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  col: { flex: 1 },
  actionBtn: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  saveBtn: { backgroundColor: THEME.colors.primary },
  cancelBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  saveBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.surface,
  },
});



// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

/**
 * Renders the empty-state message when no services have been added yet.
 */
export function EmptyServiceState(): React.ReactElement {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="bookmark-outline" size={40} color={THEME.colors.textMuted} />
      <Text style={emptyStyles.text}>No services added yet.</Text>
      <Text style={emptyStyles.subtext}>Add your first service below.</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
    gap: THEME.spacing.xs,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  subtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});

// ---------------------------------------------------------------------------
// Service Card
// ---------------------------------------------------------------------------

/** Props for ServiceCard. */
interface ServiceCardProps {
  service: PriestService;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

/**
 * Renders a single added service as a card row with edit and delete controls.
 */
export function ServiceCard({ service, index, onEdit, onDelete }: ServiceCardProps): React.ReactElement {
  function handleDelete(): void {
    Alert.alert(
      'Remove Service',
      `Remove "${service.ceremonyName}" from your services?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(index) },
      ]
    );
  }

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.row}>
        <Text style={cardStyles.name} numberOfLines={1}>{service.ceremonyName}</Text>
        <Text style={cardStyles.price}>₹{service.price.toLocaleString('en-IN')}</Text>
      </View>
      <View style={cardStyles.row}>
        <Text style={cardStyles.duration}>{formatDuration(service.durationMinutes)}</Text>
        <View style={cardStyles.actions}>
          <TouchableOpacity onPress={() => onEdit(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={18} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
          <View style={cardStyles.divider} />
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={THEME.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    ...THEME.shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  price: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.gold,
  },
  duration: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: THEME.colors.border,
  },
});

// ---------------------------------------------------------------------------
// Dropdown Picker
// ---------------------------------------------------------------------------

/** Props for DropdownPicker. */
interface DropdownPickerProps {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  error?: string;
  style?: object;
}

/**
 * Styled touchable that mimics a select/dropdown input field.
 * Opens a modal when pressed.
 */
export function DropdownPicker({ label, value, placeholder, onPress, error, style }: DropdownPickerProps): React.ReactElement {
  return (
    <View style={[dropdownStyles.wrapper, style]}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[dropdownStyles.field, error ? dropdownStyles.fieldError : null]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text style={[dropdownStyles.value, !value && dropdownStyles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={THEME.colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={dropdownStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
    minHeight: 44,
  },
  fieldError: {
    borderColor: THEME.colors.error,
  },
  value: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: THEME.colors.textMuted,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
});

// ---------------------------------------------------------------------------
// Ceremony Selection Modal
// ---------------------------------------------------------------------------

/** Props for CeremonyModal. */
interface CeremonyModalProps {
  visible: boolean;
  ceremonies: Ceremony[];
  onSelect: (ceremony: Ceremony) => void;
  onClose: () => void;
}

/**
 * Full-screen modal presenting a FlatList of available ceremony types.
 */
export function CeremonyModal({ visible, ceremonies, onSelect, onClose }: CeremonyModalProps): React.ReactElement {
  function renderItem({ item }: { item: Ceremony }): React.ReactElement {
    return (
      <TouchableOpacity style={modalStyles.item} onPress={() => onSelect(item)} activeOpacity={0.7}>
        <Text style={modalStyles.itemText}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={14} color={THEME.colors.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Select Ceremony</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ceremonies}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  itemText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
  },
});

// ---------------------------------------------------------------------------
// Duration Selection Modal
// ---------------------------------------------------------------------------

/** Props for DurationModal. */
interface DurationModalProps {
  visible: boolean;
  options: Array<{ label: string; value: number }>;
  onSelect: (option: { label: string; value: number }) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet modal for selecting service duration from a preset list.
 */
export function DurationModal({ visible, options, onSelect, onClose }: DurationModalProps): React.ReactElement {
  function renderItem({ item }: { item: { label: string; value: number } }): React.ReactElement {
    return (
      <TouchableOpacity style={modalStyles.item} onPress={() => onSelect(item)} activeOpacity={0.7}>
        <Text style={modalStyles.itemText}>{item.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Select Duration</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Shared utility
// ---------------------------------------------------------------------------

/**
 * Formats a duration in minutes to a human-readable string.
 * e.g. 30 → "30 min", 60 → "1 hr", 90 → "1 hr 30 min", 120 → "2 hrs"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const hLabel = hrs === 1 ? 'hr' : 'hrs';
  if (rem === 0) return `${hrs} ${hLabel}`;
  return `${hrs} ${hLabel} ${rem} min`;
}

// ---------------------------------------------------------------------------
// Price Input (compact, two-column layout)
// ---------------------------------------------------------------------------

/** Props for PriceInput. */
interface PriceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  style?: object;
}

/**
 * Compact price input with a ₹ prefix symbol, suitable for the two-column form row.
 */
export function PriceInput({ value, onChangeText, error, style }: PriceInputProps): React.ReactElement {
  return (
    <View style={[priceStyles.wrapper, style]}>
      <Text style={priceStyles.label}>Price (₹)</Text>
      <View style={[priceStyles.row, error ? priceStyles.rowError : null]}>
        <Text style={priceStyles.prefix}>₹</Text>
        <TextInput
          style={priceStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={THEME.colors.textMuted}
          maxLength={6}
        />
      </View>
      {error ? <Text style={priceStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const priceStyles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    minHeight: 44,
  },
  rowError: {
    borderColor: THEME.colors.error,
  },
  prefix: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginRight: THEME.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    paddingVertical: THEME.spacing.sm,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
});
