import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PlayerWaveform,
  RecordingWaveform,
} from 'react-native-audio-waveform-kit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const messagesList = [
  {
    id: Math.random(),
    uri: 'http://localhost:8081/assets/harvard.wav',
  },
  {
    id: Math.random(),
    uri: 'http://localhost:8081/assets/freesound.mp3',
  },
  {
    id: Math.random(),
    uri: 'http://localhost:8081/assets/sample.mp3',
  },
];

const App = () => {
  const [messages, setMessages] = useState<any[]>(messagesList);

  const handleStop = (output: any) => {
    if (output?.uri) {
      const newMsg = {
        id: Math.random(),
        uri: output?.uri,
        bars: output?.amplitudes,
      };

      setMessages(prev => [...prev, newMsg]);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <RecordingWaveform onStop={handleStop} />
        {messages?.map((msg, index) => (
          <PlayerWaveform
            key={msg.id}
            uri={msg.uri}
            bars={msg.bars ?? []}
            sent={index === 2}
            // playIconTintColor="purple"
            // pauseIconTintColor="purple"
            // theme={{
            //   received: {
            //     backgroundColor: '#f0f0f0',
            //     waveformFg: '#ff9500',
            //     waveformBg: 'purple',
            //     scrubberDot: '#ff9500',
            //     timerText: '#555',
            //     speedButtonBg: '#e0e0e0',
            //     speedButtonText: '#ff9500',
            //   },
            // }}
            // style={{
            //   backgroundColor: 'lightyellow',
            // }}
            containerStyle={{
              alignSelf: index == 2 ? 'flex-start' : 'flex-end',
            }}
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
});

export default App;
