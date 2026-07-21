export type AlarmState = 'ARM_AWAY' | 'ARM_HOME' | 'DISARM'

export interface AlarmAlert {
  device: string
  label: string
  alarmState: AlarmState
  time: string
  ts: number
}

export interface AwaySimStatus {
  active: boolean
  manual_active: boolean
  schedule_enabled: boolean
  schedule_active: boolean
  schedule_start: string
  schedule_end: string
  current_pool_light: string | null
}
