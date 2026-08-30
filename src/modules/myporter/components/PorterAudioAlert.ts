// src/modules/myporter/components/PorterAudioAlert.ts
// Hospital-grade audio chime synthesizer utilizing the Web Audio API

class AudioAlertEngine {
  private ctx: AudioContext | null = null

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  /**
   * Play standard Grab-style 2-tone melodic notification chime
   */
  public playNotificationChime() {
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'triangle'

      // Chord: F5 (698.46 Hz) -> A5 (880.00 Hz) -> C6 (1046.50 Hz)
      osc1.frequency.setValueAtTime(698.46, now)
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12)
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.24)

      osc2.frequency.setValueAtTime(349.23, now)
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.24)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.6)
      osc2.stop(now + 0.6)
    } catch {
      // Ignore audio policy restrictions
    }
  }

  /**
   * Play high-priority STAT Emergency Alert Chime
   */
  public playStatEmergencyAlert() {
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const startTime = now + i * 0.18

        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, startTime) // A5
        osc.frequency.setValueAtTime(1174.66, startTime + 0.08) // D6

        gain.gain.setValueAtTime(0.01, startTime)
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.16)
      }
    } catch {
      // Ignore audio policy restrictions
    }
  }

  /**
   * Play completion success sound
   */
  public playSuccessTone() {
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2) // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3) // C6

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.55)
    } catch {
      // Ignore audio policy restrictions
    }
  }
}

export const soundAlert = new AudioAlertEngine()
