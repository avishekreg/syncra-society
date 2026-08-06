// TypeScript interfaces matching PostgreSQL tables

export interface Society {
  id: string
  name: string
  address?: string | null
  created_at?: string
  subscription_status?: 'active' | 'trial' | 'cancelled'
  pricing_slab_id?: string | null
  total_flats?: number | null
  opening_bank_balance?: number | null
}

export interface SocietyBillingRules {
  society_id: string
  maintenance_due_date: number
  late_fee_grace_period_days: number
  late_fee_flat_amount: number
  interest_rate_percentage: number
  created_at?: string
  updated_at?: string
}

export type ActivationStatus = 'pending' | 'activation_paid' | 'active_subscription'

export interface SocietySubscription {
  id: string
  society_id: string
  activation_status: ActivationStatus
  total_flats?: number | null
  monthly_rate_per_flat?: number | null
  razorpay_order_id?: string | null
  razorpay_subscription_id?: string | null
  razorpay_plan_id?: string | null
  billing_cycle_anchor?: string | null
  active_until?: string | null
  created_at?: string
  updated_at?: string
}

export type SaasPlanType = 'trial' | 'medium' | 'portfolio' | 'enterprise'
export type SaasSubscriptionStatus = 'active' | 'trialing' | 'expired' | 'past_due'

export interface SaasSubscription {
  id: string
  society_id: string
  plan_type: SaasPlanType
  status: SaasSubscriptionStatus
  max_flats: number
  trial_start?: string | null
  trial_end?: string | null
  razorpay_sub_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UsageCounter {
  id: string
  society_id: string
  billing_cycle_start: string
  whatsapp_alerts_sent: number
  whatsapp_addon_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface CustomRole {
  id: string
  society_id: string
  name: string
  permissions: string[]
}

export type OccupancyUserType = 'OWNER' | 'TENANT'

export interface UserAndFlat {
  id: string
  user_id: string
  society_id: string
  flat_number: string
  name: string
  username?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: string | null
  user_type?: OccupancyUserType | null
  linked_flat_id?: string | null
  notification_primary?: boolean | null
  requires_password_change?: boolean | null
  opening_outstanding_balance?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SocietyLedgerEntry {
  id: string
  society_id: string
  date: string
  type: 'credit' | 'debit'
  amount: number
  description?: string | null
  invoice_url?: string | null
}

export interface DemoLedgerTransaction extends SocietyLedgerEntry {}

export interface DemoUnit {
  flat_number: string
  owner_name: string
  owner_email: string
  owner_mobile?: string
  balance_status: 'paid' | 'due' | 'defaulter'
  balance_due: number
  last_payment: string
  payment_history: Array<{ date: string; amount: number; method: string }>
}

export interface ShowcaseData {
  society: Society
  units: DemoUnit[]
  defaulters: MaintenanceDefaulter[]
  ledgerEntries: SocietyLedgerEntry[]
}

export interface MaintenanceContract {
  id: string
  society_id: string
  vendor_name: string
  start_date: string
  end_date: string
  document_url?: string | null
}

export interface MaintenanceDefaulter {
  id: string
  society_id: string
  society_name: string
  building: string
  flat_number: string
  tenant_name: string
  amount_due: number
  overdue_days: number
  penalty?: number
  status: 'unpaid' | 'paid'
  notes?: string | null
  created_at: string
}

export interface Complaint {
  id: string
  society_id: string
  raised_by_user_id: string
  subject: string
  description?: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at?: string
  updated_at?: string
}

export interface Notice {
  id: string
  society_id: string
  title: string
  body: string
  attachment_url?: string | null
  created_at?: string
}

export type VisitorLogStatus = 'pending_approval' | 'approved' | 'denied' | 'exited'

export interface VisitorLog {
  id: string
  society_id: string
  visitor_name: string
  purpose: string
  vehicle_number?: string | null
  target_building: string
  target_flat_number: string
  status: VisitorLogStatus
  requested_at: string
  actioned_at?: string | null
  actioned_by_user_id?: string | null
  exited_at?: string | null
  created_at?: string
  updated_at?: string
}

export type VisitorLogEventType = 'request_created' | 'approved' | 'denied' | 'exit_logged'

export interface VisitorLogEvent {
  id: string
  visitor_log_id: string
  event_type: VisitorLogEventType
  actor_user_id?: string | null
  notes?: string | null
  created_at: string
}

export type GuidebookFacilityType =
  | 'swimming_pool'
  | 'gym'
  | 'community_hall'
  | 'clubhouse'
  | 'tennis_court'
  | 'kids_play_area'
  | 'library'
  | 'parking'
  | 'other'

export interface GuidebookAmenity {
  id: string
  name: string
  facility_type: GuidebookFacilityType
  open_time: string
  close_time: string
  operating_days: string
  charges: string
  charge_notes: string
  facility_rules: string
  sort_order: number
}

export interface GuidebookCustomSection {
  id: string
  title: string
  body: string
  sort_order: number
}

export interface SocietyRulesGuidebook {
  society_id: string
  security_rules: string
  community_rules: string
  visitor_vehicle_policy: string
  amenities: GuidebookAmenity[]
  custom_sections: GuidebookCustomSection[]
  updated_at?: string
  updated_by?: string | null
}

export type GuidebookSearchHit = {
  section: string
  title: string
  excerpt: string
  score: number
}

export interface SocietyFlat {
  id: string
  society_id: string
  flat_number: string
  owner_name: string
  owner_phone: string
  created_at?: string
}

export type DeliveryServiceProvider =
  | 'Swiggy'
  | 'Zomato'
  | 'Blinkit'
  | 'Zepto'
  | 'BigBasket'
  | 'Amazon'
  | 'Flipkart'
  | 'Blue Dart'
  | 'Delhivery'
  | 'DTDC'
  | 'Xpressbees'
  | 'Shadowfax'
  | 'India Post / Speed Post'
  | 'Registered Parcel'
  | 'Generic Courier / Parcel'

export type DeliveryPreApprovalStatus = 'PRE_APPROVED' | 'COMPLETED' | 'EXPIRED'

export type TenantRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface RegularStaff {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  name: string
  role: string
  phone?: string | null
  qr_pass_code: string
  allowed_time_start: string
  allowed_time_end: string
  is_active: boolean
  created_by_user_id?: string | null
  created_at: string
  updated_at?: string
}

export interface StaffEntryLog {
  id: string
  society_id: string
  staff_id: string
  scanned_by_user_id?: string | null
  outside_window: boolean
  override_used: boolean
  notes?: string | null
  created_at: string
}

export interface DeliveryPreApproval {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  service_provider: DeliveryServiceProvider
  expected_window_end: string
  status: DeliveryPreApprovalStatus
  created_by_user_id?: string | null
  created_at: string
}

export interface TenantRequest {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  owner_id: string
  tenant_name: string
  tenant_phone: string
  tenant_email?: string | null
  occupants_count: number
  lease_start_date: string
  lease_end_date: string
  agreement_doc_url?: string | null
  status: TenantRequestStatus
  approved_by?: string | null
  rejection_reason?: string | null
  tenant_user_id?: string | null
  created_at: string
  updated_at?: string
}

export type CarpoolRideStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type CarpoolRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type KidExitApprovalStatus = 'APPROVED' | 'EXPIRED' | 'USED'
export type AmenityPricingType = 'FREE' | 'PAID'
export type AmenityBookingStatus = 'CONFIRMED' | 'CANCELLED'
export type SosAlertType = 'MEDICAL' | 'SECURITY' | 'FIRE'
export type SosAlertStatus = 'ACTIVE' | 'RESOLVED'

export interface CarpoolRide {
  id: string
  society_id: string
  offered_by_flat_id: string
  offered_by_flat_number: string
  offered_by_user_id: string
  destination: string
  departure_time: string
  available_seats: number
  notes?: string | null
  status: CarpoolRideStatus
  created_at: string
}

export interface CarpoolRequest {
  id: string
  ride_id: string
  passenger_user_id: string
  passenger_flat_id: string
  passenger_flat_number: string
  status: CarpoolRequestStatus
  created_at: string
}

export interface KidExitApproval {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  kid_name: string
  accompanied_by: string
  valid_until: string
  status: KidExitApprovalStatus
  created_by_user_id?: string | null
  created_at: string
}

export interface Amenity {
  id: string
  society_id: string
  name: string
  capacity: number
  slot_duration_mins: number
  pricing_type: AmenityPricingType
  price_per_slot: number
  is_active: boolean
  created_at?: string
}

export interface AmenityBooking {
  id: string
  society_id: string
  amenity_id: string
  flat_id: string
  flat_number: string
  user_id: string
  booking_date: string
  start_time: string
  end_time: string
  amount_paid: number
  status: AmenityBookingStatus
  created_at: string
}

export interface EmergencySosAlert {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  triggered_by_user_id: string
  alert_type: SosAlertType
  status: SosAlertStatus
  resolved_by?: string | null
  contact_phone?: string | null
  notes?: string | null
  created_at: string
  resolved_at?: string | null
}

export interface OverstayVisitorAlert {
  visitorLogId: string
  societyId: string
  visitorName: string
  purpose: string
  flatNumber: string
  enteredAt: string
  minutesInside: number
  overstayMinutes: number
}


export type AiAuditCategory = 'WATER' | 'ELECTRICITY' | 'VENDOR_INVOICE' | 'REPAIR'
export type EnergyTradeStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'
export type RecallMotionStatus = 'ACTIVE' | 'PASSED' | 'EXPIRED'
export type DisputeIssueType = 'PARKING' | 'SEEPAGE' | 'PETS' | 'NOISE'
export type DisputeStatus = 'PENDING_MEDIATION' | 'SETTLED' | 'ESCALATED' | 'DISMISSED'
export type LostAssetType = 'PHONE' | 'WATCH' | 'VEHICLE' | 'KEYS'
export type LostAssetStatus = 'LOST' | 'FOUND'

/** Owner-registered paired accessories (phone OS Bluetooth — no society mesh). */
export type PairedDeviceType = 'SMARTWATCH' | 'TWS' | 'SECONDARY_PHONE'
export type PairedSightingEvent = 'DISCONNECT_RSSI' | 'RECONNECT' | 'PROXIMITY_PING' | 'MANUAL_UPDATE'

export interface PairedBluetoothDevice {
  id: string
  society_id: string
  owner_user_id: string
  owner_flat_number?: string | null
  device_name: string
  device_type: PairedDeviceType
  bluetooth_name?: string | null
  last_seen_zone?: string | null
  last_seen_at?: string | null
  last_rssi?: number | null
  last_ping_at?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
}

export interface PairedDeviceSighting {
  id: string
  device_id: string
  society_id: string
  event_type: PairedSightingEvent
  rssi?: number | null
  zone_label?: string | null
  note?: string | null
  created_at: string
}

/** Physical lost & found — photo + Gate 1 claim only (non-electronic). */
export type LostFoundCategory = 'KEYS' | 'WALLET' | 'BAG' | 'DOCUMENTS' | 'OTHER'
export type LostFoundStatus = 'OPEN' | 'CLAIMED' | 'CLOSED'

export interface LostFoundPost {
  id: string
  society_id: string
  posted_by_user_id: string
  posted_by_flat_number?: string | null
  item_category: LostFoundCategory
  title: string
  description?: string | null
  photo_url?: string | null
  claim_desk: string
  status: LostFoundStatus
  claimed_by_user_id?: string | null
  claimed_at?: string | null
  created_at: string
}

export type ParkingListingMode = 'HOURLY' | 'MONTHLY'
export type ParkingListingStatus = 'ACTIVE' | 'PAUSED' | 'BOOKED' | 'CLOSED'
export type ParkingBookingPaymentStatus = 'PENDING_UPI' | 'PAID' | 'CREDITED' | 'CANCELLED' | 'REFUNDED'
export type ParkingBookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'AUTO_VACATE'

export interface ParkingOwnerWallet {
  id: string
  society_id: string
  owner_user_id: string
  owner_flat_number: string
  balance_inr: number
  lifetime_earned_inr: number
  upi_id?: string | null
  updated_at: string
}

export interface ParkingMarketplaceListing {
  id: string
  society_id: string
  owner_user_id: string
  owner_flat_number: string
  slot_code: string
  mode: ParkingListingMode
  available_from_local?: string | null
  available_to_local?: string | null
  hourly_rate_inr?: number | null
  owner_return_at?: string | null
  vacate_reminder_sent_at?: string | null
  monthly_rate_inr?: number | null
  lease_available_from?: string | null
  status: ParkingListingStatus
  earn_enabled: boolean
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

export interface ParkingMarketplaceBooking {
  id: string
  listing_id: string
  society_id: string
  renter_user_id: string
  renter_flat_number?: string | null
  renter_label: string
  vehicle_label?: string | null
  mode: ParkingListingMode
  starts_at: string
  ends_at: string
  hours_booked?: number | null
  amount_inr: number
  payment_method: string
  upi_reference?: string | null
  payment_status: ParkingBookingPaymentStatus
  status: ParkingBookingStatus
  created_at: string
}
export type GuardianSubjectType = 'KID' | 'SENIOR' | 'VEHICLE'
export type GuardianEventType = 'GEOFENCE_EXIT' | 'GEOFENCE_ENTER' | 'UNAUTHORIZED_MOTION'
export type GuardianAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED'

export interface AiAuditLog {
  id: string
  society_id: string
  category: AiAuditCategory
  detected_anomaly: string
  variance_percentage: number
  ai_recommendation: string
  health_score?: number | null
  created_at: string
}

export interface P2pEnergyTrade {
  id: string
  society_id: string
  seller_flat_id: string
  seller_flat_number: string
  buyer_flat_id: string
  buyer_flat_number: string
  energy_kwh: number
  credits_transferred: number
  status: EnergyTradeStatus
  created_at: string
}

export interface RecallMotion {
  id: string
  society_id: string
  target_official_role: string
  reason: string
  votes_required_count: number
  current_votes_count: number
  status: RecallMotionStatus
  created_by_user_id?: string | null
  created_at: string
}

export interface CommunityDispute {
  id: string
  society_id: string
  plaintiff_flat_id: string
  plaintiff_flat_number: string
  respondent_flat_id: string
  respondent_flat_number: string
  issue_type: DisputeIssueType
  description: string
  ai_mediation_summary?: string | null
  suggested_fine_amount?: number | null
  status: DisputeStatus
  plaintiff_signed_at?: string | null
  respondent_signed_at?: string | null
  created_by_user_id?: string | null
  created_at: string
}

export interface LostAssetSignal {
  id: string
  society_id: string
  owner_user_id: string
  owner_flat_number?: string | null
  asset_name: string
  asset_type: LostAssetType
  last_seen_location?: string | null
  last_seen_at?: string | null
  detected_by_user_id?: string | null
  ble_fingerprint?: string | null
  status: LostAssetStatus
  created_at: string
}

export interface GuardianMotionAlert {
  id: string
  society_id: string
  flat_id?: string | null
  flat_number?: string | null
  subject_type: GuardianSubjectType
  subject_label: string
  event_type: GuardianEventType
  location_label?: string | null
  owner_proximity: boolean
  status: GuardianAlertStatus
  created_at: string
}

export type BotanicalHealthStatus = 'HEALTHY' | 'NEEDS_CARE' | 'TREATED'
export type GardeningTaskType = 'WATERING' | 'FERTILIZER' | 'PRUNING' | 'PEST_CONTROL'
export type GardeningTaskStatus = 'PENDING' | 'COMPLETED'
export type CompostOrderStatus = 'REQUESTED' | 'DELIVERED' | 'CANCELLED'
export type PlantSwapType = 'CUTTING' | 'POTTED' | 'SEEDS' | 'SAPLING'
export type PlantSwapStatus = 'AVAILABLE' | 'CLAIMED' | 'CLOSED'

export interface SocietyBotanicalAsset {
  id: string
  society_id: string
  plant_name: string
  species?: string | null
  qr_tag_code: string
  location_zone: string
  planted_date?: string | null
  adopted_by_flat_id?: string | null
  adopted_by_flat_number?: string | null
  health_status: BotanicalHealthStatus
  carbon_offset_kg: number
  photo_url?: string | null
  last_diagnosis?: string | null
  care_steps?: string | null
  created_at: string
}

export interface GardeningTask {
  id: string
  society_id: string
  botanical_asset_id?: string | null
  task_type: GardeningTaskType
  assigned_gardener_name: string
  scheduled_for: string
  status: GardeningTaskStatus
  water_liters?: number | null
  fertilizer_kg?: number | null
  weather_note?: string | null
  notes?: string | null
  created_at: string
}

export interface GreenCompostInventory {
  id: string
  society_id: string
  batch_number: string
  total_weight_kg: number
  available_for_residents_kg: number
  price_per_kg: number
  created_at: string
}

export interface GreenCompostOrder {
  id: string
  society_id: string
  inventory_id: string
  flat_id: string
  flat_number: string
  requested_by_user_id: string
  quantity_kg: number
  status: CompostOrderStatus
  created_at: string
}

export interface PlantSwapListing {
  id: string
  society_id: string
  offered_by_flat_id: string
  offered_by_flat_number: string
  offered_by_user_id: string
  title: string
  plant_type: PlantSwapType
  description?: string | null
  status: PlantSwapStatus
  claimed_by_flat_number?: string | null
  created_at: string
}

export type InteriorRoomType = 'LIVING_ROOM' | 'BEDROOM' | 'BALCONY' | 'KITCHEN'
export type InteriorVendorLeadStatus = 'LEAD_GENERATED' | 'CONNECTED' | 'CLOSED'
export type InteriorVendorCategory = 'INTERIOR' | 'WOODCRAFT' | 'ELECTRONICS' | 'LIGHTING'

export interface InteriorSpatialScan {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  user_id: string
  room_type: InteriorRoomType
  room_photo_url?: string | null
  viewing_distance_ft: number
  recommended_tv_size_inches: string
  recommended_sofa_type: string
  acoustics_recommendation: string
  spatial_guidance: string[] | unknown
  created_at: string
}

export interface InteriorVendorLead {
  id: string
  society_id: string
  scan_id?: string | null
  flat_id: string
  flat_number: string
  vendor_name: string
  vendor_category: InteriorVendorCategory
  budget_range: string
  status: InteriorVendorLeadStatus
  notes?: string | null
  created_by_user_id?: string | null
  created_at: string
}

export type PropertyListingPurpose = 'RENT' | 'SALE'
export type PropertyOwnershipType = 'FREEHOLD' | 'LEASEHOLD' | 'COOPERATIVE'
export type PropertyFurnishing = 'UNFURNISHED' | 'SEMI' | 'FULLY'
export type PropertyListingStatus = 'DRAFT' | 'PUBLISHED' | 'SYNDICATED' | 'CLOSED'
export type PropertyInquiryType = 'CONTACT' | 'HOME_LOAN' | 'SITE_VISIT'

export type RwaResaleBadge = {
  label: string
  maintenanceDuesClear: boolean
  societySecurityScore: number
  nocCleared: boolean
  zeroBrokerage: boolean
  issuedAt: string
}

export interface PropertyMarketListing {
  id: string
  society_id: string
  flat_id: string
  flat_number: string
  listed_by_user_id: string
  listing_purpose: PropertyListingPurpose
  monthly_rent?: number | null
  security_deposit?: number | null
  available_from?: string | null
  furnishing?: PropertyFurnishing | null
  expected_sale_price?: number | null
  carpet_area_sqft?: number | null
  super_area_sqft?: number | null
  price_per_sqft?: number | null
  ownership_type?: PropertyOwnershipType | null
  society_noc_status: boolean
  is_negotiable: boolean
  title_document_url?: string | null
  bhk?: string | null
  parking_available: boolean
  parking_count: number
  description?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  status: PropertyListingStatus
  syndication_portals: string[] | unknown
  syndication_payload?: unknown
  rwa_resale_badge?: RwaResaleBadge | unknown
  maintenance_dues_clear: boolean
  society_security_score?: number | null
  broadcast_sent_at?: string | null
  created_at: string
  updated_at?: string
}

export interface PropertyListingInquiry {
  id: string
  society_id: string
  listing_id: string
  inquirer_user_id?: string | null
  inquirer_name: string
  inquirer_phone?: string | null
  inquirer_email?: string | null
  message?: string | null
  inquiry_type: PropertyInquiryType
  created_at: string
}
