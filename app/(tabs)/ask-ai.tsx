import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AskAIScreen() {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAsk = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium">Ask AI Assistant</Text>
            <Text variant="bodySmall" style={styles.infoText}>
              Ask questions about your health data, medications, or general health information.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.chatContainer}>
          <View style={styles.messageContainer}>
            <View style={styles.aiMessage}>
              <Text>Hello! How can I help you with your health information today?</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Type your question..."
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            multiline
          />
          <Button 
            mode="contained" 
            onPress={handleAsk} 
            loading={isLoading}
            disabled={isLoading || !query.trim()}
            style={styles.button}
          >
            Ask
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoText: {
    marginTop: 8,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  aiMessage: {
    backgroundColor: '#e1f5fe',
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    borderTopRightRadius: 4,
    maxWidth: '80%',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  button: {
    justifyContent: 'center',
  },
}); 