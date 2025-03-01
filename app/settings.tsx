// app/settings.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, SafeAreaView, Platform, StatusBar, ScrollView } from 'react-native';
import { Button, Text, List, Divider, Appbar, Switch, Avatar, Card, IconButton, Dialog, Portal, TextInput, Chip } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { useRouter } from 'expo-router';

// Mock data for family members
interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  sharedCategories: string[];
}

// Mock data for sharing categories
interface SharingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isShared: boolean;
}

export default function SettingsScreen() {
  const { fastenDomain, setFastenDomain, signOut } = useFasten();
  const router = useRouter();
  
  // State for family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { 
      id: '1', 
      name: 'Sarah Johnson', 
      relation: 'Mother',
      sharedCategories: ['Medications', 'Appointments'] 
    },
    { 
      id: '2', 
      name: 'Mike Johnson', 
      relation: 'Father',
      sharedCategories: ['Lab Results', 'Vitals'] 
    }
  ]);
  
  // State for sharing categories
  const [sharingCategories, setSharingCategories] = useState<SharingCategory[]>([
    { id: '1', name: 'Medications', description: 'Share your medication information', icon: 'pill', isShared: true },
    { id: '2', name: 'Appointments', description: 'Share your upcoming appointments', icon: 'calendar', isShared: true },
    { id: '3', name: 'Lab Results', description: 'Share your lab test results', icon: 'test-tube', isShared: true },
    { id: '4', name: 'Vitals', description: 'Share your vital signs', icon: 'heart-pulse', isShared: true },
    { id: '5', name: 'Allergies', description: 'Share your allergies', icon: 'alert-circle', isShared: false },
  ]);
  
  // State for privacy mode
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // State for notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // State for add family member dialog
  const [addMemberDialogVisible, setAddMemberDialogVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  
  // State for member sharing dialog
  const [sharingDialogVisible, setSharingDialogVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  const handleGoBack = () => {
    router.back();
  };

  const handleResetDomain = () => {
    Alert.alert(
      'Reset Domain',
      'Are you sure you want to reset your Fasten domain? You will need to enter it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            try {
              setFastenDomain('');
            } catch (error) {
              console.error('Error resetting domain:', error);
              Alert.alert('Error', 'Failed to reset domain. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleAddFamilyMember = () => {
    if (!newMemberName.trim() || !newMemberRelation.trim()) {
      Alert.alert('Error', 'Please enter both name and relation');
      return;
    }
    
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      relation: newMemberRelation.trim(),
      sharedCategories: []
    };
    
    setFamilyMembers([...familyMembers, newMember]);
    setNewMemberName('');
    setNewMemberRelation('');
    setAddMemberDialogVisible(false);
  };
  
  const handleRemoveFamilyMember = (id: string) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setFamilyMembers(familyMembers.filter(member => member.id !== id));
          }
        }
      ]
    );
  };
  
  const handleOpenSharingDialog = (member: FamilyMember) => {
    setSelectedMember(member);
    setSharingDialogVisible(true);
  };
  
  const handleToggleSharing = (categoryId: string) => {
    if (!selectedMember) return;
    
    const updatedMembers = familyMembers.map(member => {
      if (member.id === selectedMember.id) {
        const category = sharingCategories.find(c => c.id === categoryId)?.name;
        if (!category) return member;
        
        if (member.sharedCategories.includes(category)) {
          return {
            ...member,
            sharedCategories: member.sharedCategories.filter(c => c !== category)
          };
        } else {
          return {
            ...member,
            sharedCategories: [...member.sharedCategories, category]
          };
        }
      }
      return member;
    });
    
    setFamilyMembers(updatedMembers);
    // Update the selected member to reflect changes in the dialog
    setSelectedMember(updatedMembers.find(m => m.id === selectedMember.id) || null);
  };
  
  const handleToggleGlobalSharing = (categoryId: string) => {
    setSharingCategories(sharingCategories.map(category => 
      category.id === categoryId 
        ? { ...category, isShared: !category.isShared } 
        : category
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Family Sharing" right={(props) => (
            <IconButton {...props} icon="plus" onPress={() => setAddMemberDialogVisible(true)} />
          )} />
          <Card.Content>
            {familyMembers.length === 0 ? (
              <Text style={styles.emptyText}>No family members added yet</Text>
            ) : (
              familyMembers.map(member => (
                <View key={member.id} style={styles.memberContainer}>
                  <List.Item
                    title={member.name}
                    description={member.relation}
                    left={props => <Avatar.Icon {...props} icon="account" />}
                    right={props => (
                      <IconButton
                        {...props}
                        icon="dots-vertical"
                        onPress={() => handleOpenSharingDialog(member)}
                      />
                    )}
                  />
                  <View style={styles.chipContainer}>
                    {member.sharedCategories.map(category => (
                      <Chip key={category} style={styles.chip}>{category}</Chip>
                    ))}
                  </View>
                  <Divider />
                </View>
              ))
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title="Sharing Settings" />
          <Card.Content>
            <List.Item
              title="Privacy Mode"
              description="Temporarily pause all sharing"
              left={props => <List.Icon {...props} icon="shield" />}
              right={props => (
                <Switch
                  value={privacyMode}
                  onValueChange={setPrivacyMode}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Notifications"
              description="Get notified when someone shares with you"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Subheader>What You Share</List.Subheader>
            {sharingCategories.map(category => (
              <React.Fragment key={category.id}>
                <List.Item
                  title={category.name}
                  description={category.description}
                  left={props => <List.Icon {...props} icon={category.icon} />}
                  right={props => (
                    <Switch
                      value={category.isShared}
                      onValueChange={() => handleToggleGlobalSharing(category.id)}
                    />
                  )}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
        
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item 
            title="Sign Out" 
            left={props => <List.Icon {...props} icon="logout" />}
            onPress={handleSignOut}
          />
          <Divider />
          
          <List.Subheader>Domain Settings</List.Subheader>
          <List.Item 
            title="Current Domain" 
            description={fastenDomain || 'Not set'} 
            descriptionNumberOfLines={3}
            descriptionStyle={styles.domainText}
          />
          <Divider />
          <List.Item 
            title="Reset Domain" 
            left={props => <List.Icon {...props} icon="refresh" />}
            onPress={handleResetDomain}
          />
        </List.Section>
      </ScrollView>
      
      {/* Add Family Member Dialog */}
      <Portal>
        <Dialog visible={addMemberDialogVisible} onDismiss={() => setAddMemberDialogVisible(false)}>
          <Dialog.Title>Add Family Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              style={styles.dialogInput}
            />
            <TextInput
              label="Relation"
              value={newMemberRelation}
              onChangeText={setNewMemberRelation}
              style={styles.dialogInput}
              placeholder="e.g. Mother, Father, Child"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddMemberDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddFamilyMember}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Sharing Settings Dialog */}
      <Portal>
        <Dialog visible={sharingDialogVisible} onDismiss={() => setSharingDialogVisible(false)}>
          <Dialog.Title>
            Sharing with {selectedMember?.name}
          </Dialog.Title>
          <Dialog.Content>
            {sharingCategories.map(category => (
              <List.Item
                key={category.id}
                title={category.name}
                left={props => <List.Icon {...props} icon={category.icon} />}
                right={props => (
                  <Switch
                    value={selectedMember?.sharedCategories.includes(category.name) || false}
                    onValueChange={() => handleToggleSharing(category.id)}
                    disabled={!category.isShared}
                  />
                )}
              />
            ))}
            <Text style={styles.sharingNote}>
              Note: You can only share categories that are globally enabled in Sharing Settings
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleRemoveFamilyMember(selectedMember?.id || '')}>Remove</Button>
            <Button onPress={() => setSharingDialogVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  memberContainer: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 72,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  domainText: {
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dialogInput: {
    marginBottom: 16,
  },
  sharingNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  }
}); 