// src/screens/HomeScreen.js
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon 
          size={80} 
          icon="account" 
          style={styles.avatar}
        />
        <Title style={styles.welcomeTitle}>
          Welcome, {user?.username}!
        </Title>
        <Paragraph style={styles.subtitle}>
          Learning {user?.targetLanguage}
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Your Profile</Title>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{user?.username}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Target Language:</Text>
            <Text style={styles.value}>{user?.targetLanguage}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Native Language:</Text>
            <Text style={styles.value}>{user?.nativeLanguage}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Level:</Text>
            <Text style={styles.value}>{user?.level}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Total Score:</Text>
            <Text style={styles.value}>{user?.totalScore}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            icon="play"
          >
            Start Learning
          </Button>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            icon="chart-line"
          >
            View Progress
          </Button>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            icon="cog"
          >
            Settings
          </Button>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.primary,
  },
  avatar: {
    backgroundColor: theme.colors.accent,
    marginBottom: 16,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    opacity: 0.8,
    fontSize: 16,
  },
  card: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  label: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  value: {
    color: theme.colors.text,
    opacity: 0.8,
  },
  actionButton: {
    marginVertical: 8,
  },
  logoutButton: {
    margin: 16,
    marginTop: 30,
  },
});

export default HomeScreen;
