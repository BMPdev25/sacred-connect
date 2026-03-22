import re
import os

filepath = r"c:\Users\pgopa\OneDrive\Documents\GitHub\sacred-connect\app\priest\(tabs)\ProfileTab.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update personalDetails state definition to include serviceRadiusKm
content = content.replace(
    '  const [personalDetails, setPersonalDetails] = useState({ name: "", email: "", phone: "", experience: "", religiousTradition: "", description: "" });',
    '  const [personalDetails, setPersonalDetails] = useState({ name: "", email: "", phone: "", experience: "", religiousTradition: "", description: "", serviceRadiusKm: "" });'
)

# 2. Populate serviceRadiusKm in getProfile
content = content.replace(
    'religiousTradition: priestProfile.religiousTradition || "",',
    'religiousTradition: priestProfile.religiousTradition || "",\n          serviceRadiusKm: priestProfile.serviceRadiusKm?.toString() || "10",'
)

# 3. Handle savePersonalDetails payload to include serviceRadiusKm
content = content.replace(
    '        description: personalDetails.description,',
    '        description: personalDetails.description,\n        serviceRadiusKm: parseInt(personalDetails.serviceRadiusKm, 10) || 10,'
)

# 4. Remove redundant Contact Information JSX entirely
contact_info_pattern = re.compile(r'          \{/\* Reviews Section \*/\}', flags=re.MULTILINE)
# We need to replace the exact block of Contact Information. Let's find it.
contact_info_block = r"""          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsPersonalModalVisible(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>
                {userInfo?.phone || "+91 XXXXX XXXXX"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {userInfo?.email || "example@email.com"}
              </Text>
            </View>
          </View>"""
content = content.replace(contact_info_block, '')

# 5. Add Service Radius, Phone, and Email explicitly into Personal Details display InfoCard
# It currently has: Location, let's replace the whole Location infoRow.
location_block = r"""            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {profile?.address
                  ? profile.address
                  : profile?.location && profile.location.coordinates[0] !== 0
                    ? `Lat: ${profile.location.coordinates[1].toFixed(4)}, Lng: ${profile.location.coordinates[0].toFixed(4)}`
                    : 'Not set'}
              </Text>
            </View>"""
new_location_block = r"""            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{userInfo?.phone || "+91 XXXXX XXXXX"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{userInfo?.email || "example@email.com"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location Coordinates</Text>
              <Text style={styles.infoValue}>
                {profile?.location && profile.location.coordinates[0] !== 0
                  ? `Lat: ${profile.location.coordinates[1].toFixed(4)}, Lng: ${profile.location.coordinates[0].toFixed(4)}`
                  : 'Not Set'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Radius (Km)</Text>
              <Text style={styles.infoValue}>{profile?.serviceRadiusKm || 10} km</Text>
            </View>"""
content = content.replace(location_block, new_location_block)


# 6. Make Verification Documents compact if verified
verification_block = r"""          <View style={styles.documentsCard}>"""
verification_replacement = r"""          {profile?.isVerified ? (
            <View style={[styles.documentsCard, { alignItems: 'center', paddingVertical: 24 }]}>
              <Ionicons name="checkmark-circle" size={48} color={APP_COLORS.success} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: APP_COLORS.success }}>Account Verified</Text>
              <Text style={{ fontSize: 14, color: APP_COLORS.gray, textAlign: 'center', marginTop: 8 }}>
                Your identity and religious certifications have been successfully verified by Sacred Connect.
              </Text>
            </View>
          ) : (
          <View style={styles.documentsCard}>"""
content = content.replace(verification_block, verification_replacement)
# Close the ternary after </View> from the documentsCard.
end_doc_card_block = r"""          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>"""
end_doc_card_replacement = r"""          </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>"""
content = content.replace(end_doc_card_block, end_doc_card_replacement)

# 7. Add Service Areas & Specializations read-only block right BEFORE Temple Affiliation
add_areas_block = r"""          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>"""
areas_replacement = r"""          {(profile?.specializations && profile.specializations.length > 0) && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Specializations</Text>
              </View>
              <View style={styles.infoCard}>
                {profile.specializations.map((spec: any, idx: number) => (
                  <View key={`spec-${idx}`} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{spec.name}</Text>
                    <Text style={styles.infoValue}>{spec.experience} yr exp | {spec.verificationStatus}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {(profile?.serviceAreas && profile.serviceAreas.length > 0) && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Custom Service Areas</Text>
              </View>
              <View style={styles.infoCard}>
                {profile.serviceAreas.map((area: any, idx: number) => (
                  <View key={`area-${idx}`} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{area.city}, {area.state}</Text>
                    <Text style={styles.infoValue}>Radius: {area.radius}km | Travel Charge: ₹{area.travelCharges}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>"""
content = content.replace(add_areas_block, areas_replacement)


# 8. Add serviceRadiusKm to PersonalDetailsModal
modal_insertion_1 = r"""              <Text style={localStyles.inputLabel}>Bio / Description</Text>"""
modal_replacement_1 = r"""              <Text style={localStyles.inputLabel}>Service Radius (Km)</Text>
              <TextInput style={localStyles.input} value={personalDetails.serviceRadiusKm} onChangeText={(text) => setPersonalDetails({ ...personalDetails, serviceRadiusKm: text })} keyboardType="numeric" />

              <Text style={localStyles.inputLabel}>Bio / Description</Text>"""
content = content.replace(modal_insertion_1, modal_replacement_1)


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("File successfully patched with backend alignment UX.")
