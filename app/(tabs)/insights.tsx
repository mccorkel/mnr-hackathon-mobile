import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, List, Divider, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Define types for our health metrics
type TrendType = 'up' | 'down' | 'stable';

interface HealthMetric {
  id: string;
  title: string;
  value: number;
  trend: TrendType;
  description: string;
}

export default function InsightsScreen() {
  // Mock data for health insights
  const healthMetrics: HealthMetric[] = [
    { 
      id: '1', 
      title: 'Activity Level', 
      value: 0.75, 
      trend: 'up', 
      description: 'Your activity has increased by 15% this week'
    },
    { 
      id: '2', 
      title: 'Sleep Quality', 
      value: 0.65, 
      trend: 'down', 
      description: 'Your sleep quality has decreased slightly'
    },
    { 
      id: '3', 
      title: 'Heart Health', 
      value: 0.85, 
      trend: 'stable', 
      description: 'Your heart rate has been consistent'
    },
    { 
      id: '4', 
      title: 'Nutrition', 
      value: 0.60, 
      trend: 'up', 
      description: 'Your nutrition score has improved'
    }
  ];

  // Helper function to render trend icon
  const renderTrendIcon = (trend: TrendType) => {
    switch(trend) {
      case 'up':
        return <Ionicons name="arrow-up" size={16} color="#4CAF50" />;
      case 'down':
        return <Ionicons name="arrow-down" size={16} color="#F44336" />;
      case 'stable':
        return <Ionicons name="remove" size={16} color="#2196F3" />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.content}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleLarge">Health Insights</Text>
              <Text variant="bodyMedium" style={styles.summaryText}>
                Based on your recent health data, here's what we've observed
              </Text>
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Trends & Metrics</Text>
          
          {healthMetrics.map((metric) => (
            <Card key={metric.id} style={styles.metricCard}>
              <Card.Content>
                <View style={styles.metricHeader}>
                  <Text variant="titleMedium">{metric.title}</Text>
                  <View style={styles.trendContainer}>
                    {renderTrendIcon(metric.trend)}
                  </View>
                </View>
                <ProgressBar progress={metric.value} color={getColorForValue(metric.value)} style={styles.progressBar} />
                <Text variant="bodySmall" style={styles.metricDescription}>
                  {metric.description}
                </Text>
              </Card.Content>
            </Card>
          ))}

          <Text variant="titleMedium" style={styles.sectionTitle}>Recommendations</Text>
          
          <Card style={styles.recommendationsCard}>
            <Card.Content>
              <List.Item
                title="Improve Sleep Quality"
                description="Try to maintain a consistent sleep schedule"
                left={props => <List.Icon {...props} icon="sleep" />}
              />
              <Divider />
              <List.Item
                title="Stay Hydrated"
                description="Aim to drink at least 8 glasses of water daily"
                left={props => <List.Icon {...props} icon="water" />}
              />
              <Divider />
              <List.Item
                title="Regular Exercise"
                description="Consider adding 10 more minutes to your daily activity"
                left={props => <List.Icon {...props} icon="run" />}
              />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to get color based on value
function getColorForValue(value: number): string {
  if (value >= 0.8) return '#4CAF50'; // Green for good
  if (value >= 0.6) return '#2196F3'; // Blue for moderate
  if (value >= 0.4) return '#FF9800'; // Orange for caution
  return '#F44336'; // Red for concern
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryText: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  metricCard: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  metricDescription: {
    marginTop: 4,
  },
  recommendationsCard: {
    marginBottom: 24,
  },
}); 