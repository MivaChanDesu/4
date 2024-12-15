import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ToastAndroid } from "react-native";
import * as SQLite from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";

let db;

async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync("songs.db");
    await db.execAsync(`
     PRAGMA journal_mode = WAL;
     CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist TEXT,
        title TEXT,
        timestamp TEXT
     );
    `);
    console.log("Database initialized");
  } catch (error) {
    console.log("Error while initializing database: ", error);
  }
}

const App = () => {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    initializeDatabase();
    checkInternetConnection();
    const interval = setInterval(fetchCurrentSong, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkInternetConnection = () => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
        ToastAndroid.show("Запуск в автономном режиме", ToastAndroid.LONG);
      }
    });
  };

  const fetchCurrentSong = async () => {
    try {
      const response = await fetch("https://swapi.dev/api/people/1/");
      const data = await response.json();

      const artist = data.name;
      const title = data.gender;

      await saveSong(artist, title);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const saveSong = async (artist, title) => {
    try {
      const lastPerson = await db.getAllAsync(
        "SELECT * FROM songs ORDER BY id DESC LIMIT 1"
      );
      if (!lastPerson[0] || lastPerson[0].title !== title) {
        await db.runAsync(
          "INSERT INTO songs (artist, title, timestamp) VALUES (?, ?, ?)",
          [artist, title, new Date().toISOString()]
        );
        await loadSongs();
      }
    } catch (error) {
      console.log("Error while saving person: ", error);
    }
  };

  const loadSongs = async () => {
    try {
      const allRows = await db.getAllAsync("SELECT * FROM songs");
      setSongs(allRows);
    } catch (error) {
      console.log("Error while loading songs: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Статистика проигрываемых песен</Text>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.songItem}>
            <Text>Исполнитель: {item.artist}</Text>
            <Text>Название: {item.title}</Text>
            <Text>Время: {item.timestamp}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  songItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default App;
