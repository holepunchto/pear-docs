import React, { useState, useEffect, useRef } from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  View,
  TextInput,
  FlatList,
  ScrollView,
  Switch,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView
} from 'react-native'

import { Worklet } from 'react-native-bare-kit'
import FramedStream from 'framed-stream'
import b4a from 'b4a'
import ThemedText from '../../components/ThemedText'

const source = require('./bluetooth.bundle')

// Keeps the message input above the keyboard on iOS.
const KEYBOARD_VERTICAL_OFFSET = 120

type AppState = 'init' | 'ready' | 'inviting' | 'invited' | 'chatting'

interface Device {
  id: string
  name: string
  rssi: number
}

interface ChatMessage {
  id: number
  text: string
  from: 'local' | 'remote'
}

async function requestAndroidBluetoothPermissions() {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  ].filter(Boolean)

  const results = await PermissionsAndroid.requestMultiple(permissions)
  const granted = PermissionsAndroid.RESULTS.GRANTED

  return permissions.every((permission) => results[permission] === granted)
}

export default function BluetoothTests({ logsEnabled }: { logsEnabled: boolean }) {
  const workletRef = useRef<Worklet | null>(null)
  const streamRef = useRef<any>(null)
  const logScrollRef = useRef<ScrollView | null>(null)
  const msgListRef = useRef<FlatList<ChatMessage> | null>(null)
  const msgIdRef = useRef(0)

  const [state, setState] = useState<AppState>('init')
  const [bleState, setBleState] = useState('unknown')
  const [name, setName] = useState('Bare-' + Platform.OS)
  const [advertising, setAdvertising] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<Map<string, Device>>(new Map())
  const [inviterName, setInviterName] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-79), msg])
  }

  useEffect(() => {
    const start = async () => {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidBluetoothPermissions()

        if (!granted) {
          const message = 'Android Bluetooth permissions were not granted'
          setError(message)
          addLog(message)
          return
        }
      }

      const worklet = new Worklet()
      workletRef.current = worklet
      worklet.start('bluetooth.bundle', source, [name, String(logsEnabled)])

      const stream = new FramedStream(worklet.IPC)
      streamRef.current = stream

      stream.on('data', (data: Uint8Array) => {
        try {
          const msg = JSON.parse(b4a.toString(data))

          switch (msg.type) {
            case 'ready':
              setState('ready')
              addLog('BLE ready')
              break
            case 'bleState':
              setBleState(msg.state)
              addLog('BLE state: ' + msg.state)
              break
            case 'log':
              addLog(msg.message)
              break
            case 'discovered':
              setDevices((prev) => {
                const next = new Map(prev)
                next.set(msg.id, { id: msg.id, name: msg.name, rssi: msg.rssi })
                return next
              })
              break
            case 'advertisingStarted':
              setAdvertising(true)
              addLog('Advertising started')
              break
            case 'advertisingStopped':
              setAdvertising(false)
              addLog('Advertising stopped')
              break
            case 'scanStarted':
              setScanning(true)
              setDevices(new Map())
              addLog('Scan started')
              break
            case 'scanStopped':
              setScanning(false)
              setDevices(new Map())
              addLog('Scan stopped')
              break
            case 'inviteSent':
              setState('inviting')
              addLog('Invite sent, waiting...')
              break
            case 'inviteReceived':
              setState('invited')
              setInviterName(msg.name)
              addLog('Invite from: ' + msg.name)
              break
            case 'chatStarted':
              setState('chatting')
              setMessages([])
              addLog('Chat started!')
              break
            case 'inviteRejected':
              setState('ready')
              addLog('Invite rejected')
              break
            case 'message':
              setMessages((prev) => [
                ...prev,
                { id: ++msgIdRef.current, text: msg.text, from: msg.from }
              ])
              break
            case 'disconnected':
              setState('ready')
              addLog('Disconnected')
              break
            case 'error':
              setError(msg.message)
              addLog('Error: ' + msg.message)
              setTimeout(() => setError(null), 3000)
              break
          }
        } catch (err) {
          addLog('Parse error')
        }
      })
    }

    start().catch((err) => {
      const message = 'Bluetooth startup failed: ' + (err && err.message ? err.message : err)
      setError(message)
      addLog(message)
    })

    return () => {
      const stream = streamRef.current
      const worklet = workletRef.current
      streamRef.current = null

      // Tell the peer we're leaving so it tears down cleanly instead of waiting
      // for the BLE supervision timeout, then give the worklet a moment to write
      // the disconnect over the air before terminating it.
      try {
        stream?.write(b4a.from(JSON.stringify({ type: 'disconnect' })))
      } catch {}

      setTimeout(() => worklet?.terminate(), 150)
    }
  }, [])

  useEffect(() => {
    if (!streamRef.current) return
    streamRef.current.write(
      b4a.from(JSON.stringify({ type: 'setLogsEnabled', enabled: logsEnabled }))
    )
  }, [logsEnabled])

  const sendToWorklet = (msg: any) => {
    if (!streamRef.current) return
    streamRef.current.write(b4a.from(JSON.stringify(msg)))
  }

  const toggleAdvertising = (enabled: boolean) => {
    sendToWorklet({ type: 'setAdvertising', enabled })
  }

  const toggleScan = (enabled: boolean) => {
    sendToWorklet({ type: 'setScan', enabled })
  }

  const removeAllServices = () => {
    sendToWorklet({ type: 'removeAllServices' })
  }

  const inviteDevice = (id: string) => {
    addLog('Invite tapped: ' + id.slice(0, 16))
    sendToWorklet({ type: 'invite', id })
  }

  const acceptInvite = () => {
    sendToWorklet({ type: 'accept' })
  }

  const rejectInvite = () => {
    sendToWorklet({ type: 'reject' })
  }

  const sendMessage = () => {
    if (!inputText.trim()) return
    sendToWorklet({ type: 'send', text: inputText.trim() })
    setInputText('')
  }

  const disconnectChat = () => {
    sendToWorklet({ type: 'disconnect' })
  }

  const renderDeviceList = () => {
    const deviceList = Array.from(devices.values())
    if (deviceList.length === 0) {
      return <ThemedText style={styles.emptyText}>Scanning for nearby devices...</ThemedText>
    }
    return (
      <FlatList
        data={deviceList}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <ThemedText style={styles.deviceName}>{item.name}</ThemedText>
              <ThemedText style={styles.deviceDetail}>
                RSSI: {item.rssi} dBm | {item.id.substring(0, 8)}...
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.inviteButton} onPress={() => inviteDevice(item.id)}>
              <ThemedText style={styles.inviteButtonText}>Invite</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      />
    )
  }

  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
    >
      <View style={styles.chatHeader}>
        <ThemedText style={styles.chatTitle}>Chat</ThemedText>
        <TouchableOpacity style={styles.disconnectButton} onPress={disconnectChat}>
          <ThemedText style={styles.disconnectText}>Disconnect</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={msgListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        style={styles.messageList}
        onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.from === 'local' ? styles.localMessage : styles.remoteMessage
            ]}
          >
            <ThemedText style={[styles.messageText, item.from === 'local' && { color: '#fff' }]}>
              {item.text}
            </ThemedText>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder='Type a message...'
          placeholderTextColor='#999'
          returnKeyType='send'
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <ThemedText style={styles.sendButtonText}>Send</ThemedText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )

  const renderInvite = () => (
    <View style={styles.inviteContainer}>
      <ThemedText style={styles.inviteTitle}>{inviterName} wants to chat</ThemedText>
      <View style={styles.inviteActions}>
        <TouchableOpacity style={styles.acceptButton} onPress={acceptInvite}>
          <ThemedText style={styles.acceptText}>Accept</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={rejectInvite}>
          <ThemedText style={styles.rejectText}>Reject</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.label}>Name:</ThemedText>
          <ThemedText style={styles.nameValue}>{name}</ThemedText>
        </View>
        <View style={styles.toggleRow}>
          <ThemedText style={styles.label}>Discoverable</ThemedText>
          <Switch
            value={advertising}
            onValueChange={toggleAdvertising}
            disabled={
              state === 'init' ||
              state === 'chatting' ||
              state === 'inviting' ||
              state === 'invited'
            }
          />
        </View>
        <View style={styles.toggleRow}>
          <ThemedText style={styles.label}>Scan</ThemedText>
          <Switch
            value={scanning}
            onValueChange={toggleScan}
            disabled={
              state === 'init' ||
              state === 'chatting' ||
              state === 'inviting' ||
              state === 'invited'
            }
          />
        </View>
        {Platform.OS === 'ios' && (
          <View style={styles.toggleRow}>
            <ThemedText style={styles.label}>Stop accepting invites</ThemedText>
            <TouchableOpacity
              style={styles.removeServicesButton}
              onPress={removeAllServices}
              disabled={state === 'init'}
            >
              <ThemedText style={styles.removeServicesText}>Stop</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <ThemedText style={styles.stateText}>
          BLE: {bleState} | State: {state}
        </ThemedText>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {state === 'init' && (
        <ThemedText style={styles.emptyText}>Initializing Bluetooth...</ThemedText>
      )}

      {state === 'ready' && !scanning && (
        <ThemedText style={styles.emptyText}>
          Toggle Discoverable to be visible, then Scan to find others
        </ThemedText>
      )}

      {state === 'ready' && scanning && renderDeviceList()}

      {state === 'inviting' && (
        <View style={styles.inviteContainer}>
          <ThemedText style={styles.inviteTitle}>Invite sent</ThemedText>
          <ThemedText style={styles.emptyText}>Waiting for response...</ThemedText>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => {
              disconnectChat()
            }}
          >
            <ThemedText style={styles.rejectText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {state === 'invited' && renderInvite()}

      {state === 'chatting' && renderChat()}

      <View style={styles.logContainer}>
        <ThemedText style={styles.logTitle}>Log</ThemedText>
        <ScrollView
          ref={logScrollRef}
          style={styles.logScroll}
          onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {log.map((entry, i) => (
            <ThemedText key={i} style={styles.logEntry}>
              {entry}
            </ThemedText>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8
  },
  nameValue: {
    fontSize: 14,
    color: '#007AFF'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  stateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  removeServicesButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  removeServicesText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13
  },
  list: {
    flex: 1,
    marginBottom: 8
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600'
  },
  deviceDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600'
  },
  inviteContainer: {
    alignItems: 'center',
    marginTop: 30
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12
  },
  acceptButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8
  },
  acceptText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600'
  },
  rejectButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10
  },
  rejectText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600'
  },
  chatContainer: {
    flex: 1
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  disconnectButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  disconnectText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600'
  },
  messageList: {
    flex: 1,
    marginBottom: 8
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 3
  },
  localMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end'
  },
  remoteMessage: {
    backgroundColor: '#525252',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 15,
    color: '#000'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  sendButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600'
  },
  logContainer: {
    height: 180,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  logScroll: {
    flex: 1
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4
  },
  logEntry: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16
  }
})
