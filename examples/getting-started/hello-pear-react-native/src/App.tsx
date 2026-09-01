/* global __DEV__ */

import { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { reloadAppAsync } from 'expo-modules-core'
import { StatusBar } from 'expo-status-bar'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import PearRuntime from 'pear-mobile'

import FramedStream from 'framed-stream'
import b4a from 'b4a'
import bundle from './worker.bundle.js'
import { version, upgrade, name, productName } from '../package.json'

const appName = productName ?? name

export default function App() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null)
  const shouldReload = useRef(false)

  useEffect(() => {
    const IPC = PearRuntime.run('/worker.bundle', bundle, [
      (!__DEV__).toString(),
      version,
      upgrade,
      appName
    ])
    const pipe = new FramedStream(IPC)

    setApplyUpdate(() => () => pipe.write('pear:applyUpdate'))

    pipe.on('data', (data) => {
      const parsed = b4a.toString(data)

      if (parsed === 'updating') {
        setStatus('updating')
        return
      }

      if (parsed === 'updated') {
        setStatus('updated')
        return
      }

      if (parsed === 'minver-required') {
        setStatus('incompatible')
        return
      }

      if (parsed.startsWith('pear:updateFailed')) {
        shouldReload.current = false
        setError(parsed.slice('pear:updateFailed '.length) || 'Update failed')
        setStatus('failed')
        return
      }

      if (parsed === 'pear:updateApplied') {
        if (shouldReload.current) {
          reloadAppAsync('Pear update applied').catch((err) => {
            setError(`Reload failed: ${err instanceof Error ? err.message : String(err)}`)
            setStatus('failed')
          })
          return
        }

        setStatus('')
        return
      }
    })

    pipe.on('error', (err) => console.error(err))

    return () => {
      pipe.destroy()
    }
  }, [])

  const title =
    status === 'updating'
      ? 'UPDATING...'
      : status === 'updated' || status === 'applying'
        ? 'Update ready!'
        : status === 'incompatible'
          ? `Update available on the ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`
          : status === 'failed'
            ? error
            : `v${version}`

  return (
    <LinearGradient
      colors={['#21c437', '#0e4f15']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {(status === 'updated' || status === 'applying') && (
          <Pressable
            disabled={status === 'applying' || !applyUpdate}
            onPress={() => {
              setStatus('applying')
              try {
                shouldReload.current = true
                applyUpdate?.()
              } catch (err) {
                shouldReload.current = false
                setError(`Update failed: ${err instanceof Error ? err.message : String(err)}`)
                setStatus('failed')
              }
            }}
            style={({ pressed }) => [
              styles.updateButton,
              (pressed || status === 'applying') && styles.updateButtonActive
            ]}
          >
            <Text style={styles.updateButtonText}>
              {status === 'applying' ? 'Updating...' : 'Apply update'}
            </Text>
          </Pressable>
        )}
      </View>
      <StatusBar style='light' />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  updateButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: '#008000'
  },
  updateButtonActive: {
    backgroundColor: '#adff2f'
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18
  }
})
