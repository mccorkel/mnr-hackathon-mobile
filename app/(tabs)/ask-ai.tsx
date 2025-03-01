import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFasten } from '@/hooks/useFasten';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Message type for chat
type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

// Key for storing chat history in AsyncStorage
const CHAT_HISTORY_KEY = 'ask_ai_chat_history';

// LLM Domain Input Component
function LlmDomainInput() {
  const { setLlmDomain } = useFasten();
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validate the domain (optional)
      const formattedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
      
      // Save the domain
      setLlmDomain(formattedDomain);
    } catch (error) {
      console.error('Error saving LLM domain:', error);
      setError('Failed to save domain. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.domainContainer}>
      <Card style={styles.domainCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.domainTitle}>
            Connect to AI Service
          </Text>
          <Text variant="bodyMedium" style={styles.domainSubtitle}>
            Enter the domain of your LLM service to enable AI chat functionality.
          </Text>
          
          <TextInput
            label="LLM Domain URL"
            value={domain}
            onChangeText={setDomain}
            mode="outlined"
            style={styles.domainInput}
            placeholder="https://your-llm-service.com"
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isSubmitting}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.domainButton}
          >
            Connect
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

// Chat Component
function ChatInterface() {
  const { llmDomain } = useFasten();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you with your health information today?', isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Load chat history from AsyncStorage when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory) as Message[];
          if (parsedHistory && parsedHistory.length > 0) {
            setMessages(parsedHistory);
            console.log('Loaded chat history:', parsedHistory.length, 'messages');
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsHistoryLoaded(true);
      }
    };

    loadChatHistory();
  }, []);

  // Save chat history to AsyncStorage whenever messages change
  useEffect(() => {
    const saveChatHistory = async () => {
      if (!isHistoryLoaded) return; // Don't save until initial load is complete
      
      try {
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        console.log('Saved chat history:', messages.length, 'messages');
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };

    saveChatHistory();
  }, [messages, isHistoryLoaded]);

  // Function to clear chat history
  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([
        { id: '1', text: 'Hello! How can I help you with your health information today?', isUser: false }
      ]);
      console.log('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  // Function to handle asking a question
  const handleAsk = async () => {
    if (!query.trim() || !llmDomain) return;
    
    const userMessage = { id: Date.now().toString(), text: query, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError('');
    
    // Create a placeholder for the AI response
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', isUser: false }]);
    
    // Prepare request data for debugging
    const requestData = {
      model: "llama3.2:3b",
      prompt: query
    };
    
    // Log request details
    console.log('=== LLM REQUEST ===');
    console.log(`URL: ${llmDomain}/api/generate`);
    console.log('Method: POST');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('Body:', JSON.stringify(requestData, null, 2));
    
    try {
      console.log('Sending request...');
      
      // Use XMLHttpRequest instead of fetch for better streaming support in React Native
      const xhr = new XMLHttpRequest();
      let responseBuffer = '';
      let chunkCount = 0;
      let aiResponse = '';
      
      // Set up the request
      xhr.open('POST', `${llmDomain}/api/generate`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Handle streaming data as it comes in
      xhr.onprogress = (event) => {
        if (event.loaded > responseBuffer.length) {
          // Get only the new data
          const newData = xhr.responseText.substring(responseBuffer.length);
          responseBuffer = xhr.responseText;
          
          chunkCount++;
          console.log(`=== CHUNK ${chunkCount} ===`);
          console.log(newData);
          
          // Try to parse the new data as JSON
          try {
            // The response might contain multiple JSON objects, so we need to split and process each
            const lines = newData.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                const jsonResponse = JSON.parse(line);
                console.log('Parsed JSON:', jsonResponse);
                
                // Accumulate the AI response instead of replacing it
                aiResponse += jsonResponse.response || '';
                
                // Update the message in the state with the accumulated response
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: aiResponse } : msg
                  )
                );
                
                // If done, we can stop processing (but the request will continue)
                if (jsonResponse.done) {
                  console.log('Response marked as done');
                }
              } catch (e) {
                console.error('Error parsing JSON from line:', e, line);
              }
            }
          } catch (e) {
            console.error('Error processing chunks:', e);
          }
        }
      };
      
      // Handle request completion
      xhr.onload = () => {
        console.log('=== REQUEST COMPLETE ===');
        console.log('Status:', xhr.status);
        console.log('Response:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Request was successful
          console.log('Request successful');
        } else {
          // Request failed
          console.error('Request failed with status:', xhr.status);
          setError(`Server error: ${xhr.status}`);
          
          // Update the AI message to show the error
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId ? { ...msg, text: `Sorry, I encountered an error (${xhr.status}).` } : msg
            )
          );
        }
        
        setIsLoading(false);
        setQuery('');
      };
      
      // Handle network errors
      xhr.onerror = () => {
        console.error('=== NETWORK ERROR ===');
        setError('Network error. Please check your connection and try again.');
        
        // Update the AI message to show the error
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: 'Sorry, I encountered a network error. Please check your connection.' } : msg
          )
        );
        
        setIsLoading(false);
        setQuery('');
      };
      
      // Send the request
      xhr.send(JSON.stringify(requestData));
      
    } catch (error) {
      console.error('=== ERROR ===');
      console.error('Error generating response:', error);
      
      setError('Failed to get a response. Please try again.');
      
      // Update the AI message to show the error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' } : msg
        )
      );
      
      setIsLoading(false);
      setQuery('');
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.infoText}>
          Ask questions about your health data, medications, or general health information.
        </Text>
        <Button 
          mode="text" 
          compact={true} 
          onPress={clearChatHistory}
          style={styles.clearButton}
          labelStyle={styles.clearButtonLabel}
        >
          Clear Chat
        </Button>
      </View>
      
      <ScrollView 
        style={styles.chatContainer}
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
            ]}
          >
            <View style={message.isUser ? styles.userMessage : styles.aiMessage}>
              <Text>{message.text}</Text>
            </View>
          </View>
        ))}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Type your question..."
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            multiline
            disabled={isLoading}
            dense={true}
          />
          <Button 
            mode="contained" 
            onPress={handleAsk} 
            loading={isLoading}
            disabled={isLoading || !query.trim()}
            style={styles.button}
            compact={true}
          >
            Ask
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Main component
export default function AskAIScreen() {
  const { llmDomain } = useFasten();
  
  // Log when the component mounts or llmDomain changes
  useEffect(() => {
    console.log('AskAIScreen rendered with LLM domain:', llmDomain);
  }, [llmDomain]);
  
  return (
    <View style={styles.mainContainer}>
      {llmDomain ? <ChatInterface /> : <LlmDomainInput />}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 4,
    paddingTop: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 2,
    borderRadius: 4,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearButtonLabel: {
    fontSize: 12,
    color: '#0a7ea4',
  },
  chatContainer: {
    flex: 1,
    marginBottom: 2,
  },
  chatContent: {
    paddingVertical: 2,
  },
  messageContainer: {
    marginBottom: 6,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiMessage: {
    backgroundColor: '#e1f5fe',
    padding: 8,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 12,
    borderTopRightRadius: 4,
    maxWidth: '85%',
  },
  keyboardAvoidingContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  input: {
    flex: 1,
    marginRight: 6,
    maxHeight: 80,
  },
  button: {
    justifyContent: 'center',
    height: 40,
  },
  errorContainer: {
    padding: 4,
    marginBottom: 6,
  },
  errorText: {
    color: 'red',
    marginVertical: 2,
  },
  // Domain input styles
  domainContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  domainCard: {
    marginBottom: 16,
  },
  domainTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  domainSubtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  domainInput: {
    marginBottom: 16,
  },
  domainButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
}); 