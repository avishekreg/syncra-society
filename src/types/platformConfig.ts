export type SidebarModuleKey =
  | 'helpdesk'
  | 'visitorLogs'
  | 'surveys'
  | 'gallery'
  | 'elections'
  | 'rewards'
  | 'gatekeeper'
  | 'notices'
  | 'whatsappAutomation'

export type SurveyEngineConfig = {
  enabled: boolean
  maxQuestionsPerSurvey: number
  maxOptionsPerQuestion: number
  allowMultipleResponses: boolean
  defaultClosingDays: number
}

export type ElectionModuleConfig = {
  enabled: boolean
  maxPositionsPerElection: number
  maxCandidatesPerPosition: number
  defaultPositionTemplates: string[]
  allowAnonymousVoting: boolean
}

export type PlatformConfig = {
  sidebarModules: Record<SidebarModuleKey, boolean>
  surveyEngine: SurveyEngineConfig
  electionModule: ElectionModuleConfig
  updatedAt: string
}

export const SIDEBAR_MODULE_LABELS: Record<
  SidebarModuleKey,
  { label: string; description: string; scope: 'resident' | 'rwa' | 'both' }
> = {
  helpdesk: { label: 'Smart Helpdesk', description: 'Resident ticket portal', scope: 'resident' },
  visitorLogs: { label: 'Visitor Logs', description: 'Resident visitor history', scope: 'resident' },
  surveys: { label: 'Surveys', description: 'Community polls & feedback', scope: 'both' },
  gallery: { label: 'Photo Gallery', description: 'Society media library', scope: 'both' },
  elections: { label: 'Elections', description: 'Encrypted resident voting', scope: 'both' },
  rewards: { label: 'Rewards & Recognition', description: 'Governance scoring badges', scope: 'both' },
  gatekeeper: { label: 'Guard Console', description: 'Gate entry management', scope: 'rwa' },
  notices: { label: 'Notices', description: 'Society announcements', scope: 'rwa' },
  whatsappAutomation: { label: 'WhatsApp Automation', description: 'n8n broadcast routing', scope: 'rwa' }
}
