import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Switch,
  FAB,
  Divider,
  List,
  Chip,
  useTheme,
} from 'react-native-paper';
import { useThemeToggle } from '../app/_layout';

const MaterialExample = () => {
  const [text, setText] = useState('');
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const theme = useTheme();
  
  // Fallback background color in case theme.colors is undefined
  const backgroundColor = theme?.colors?.background || '#f6f6f6';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Appbar.Header>
        <Appbar.Content title="Material Design Example" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          {/* Revert to the original image implementation */}
          <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
          <Card.Content>
            <Title>Material Design</Title>
            <Paragraph>
              This is an example of Material Design components using React Native Paper.
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>Cancel</Button>
            <Button mode="contained">Ok</Button>
          </Card.Actions>
        </Card>

        <TextInput
          label="Email"
          value={text}
          onChangeText={text => setText(text)}
          style={styles.input}
        />

        <View style={styles.row}>
          <Paragraph>Dark mode</Paragraph>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>Some Items</List.Subheader>
          <List.Item
            title="First Item"
            description="Item description"
            left={props => <List.Icon {...props} icon="folder" />}
          />
          <List.Item
            title="Second Item"
            description="Item description"
            left={props => <List.Icon {...props} icon="folder" />}
          />
        </List.Section>

        <View style={styles.chipContainer}>
          <Chip icon="information" onPress={() => {}} style={styles.chip}>Information</Chip>
          <Chip icon="alert" onPress={() => {}} style={styles.chip}>Alert</Chip>
          <Chip icon="check" onPress={() => {}} style={styles.chip}>Success</Chip>
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  chip: {
    margin: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MaterialExample; 