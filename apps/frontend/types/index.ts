export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNo: string
}

export interface LocationDetails {
  city: string
  district: string
  roadName: string
  state: string
  country: string
  postalCode: string
  neighborhood: string
  landmark: string
  placeId: string
  formattedAddress: string
  addressComponents: AddressComponent[]
  placeTypes: string[]
}

export interface AddressComponent {
  longName: string
  shortName: string
  types: string[]
}

export interface IssueReportRequest {
  token: string
  content: string
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  district: string
  locationDetails?: LocationDetails
}

export interface IssueReport {
  id: string
  type: string
  content?: string
  city: string
  district: string
  roadName?: string
  state?: string
  country?: string
  postalCode?: string
  neighborhood?: string
  landmark?: string
  formattedAddress?: string
  placeTypes?: string[]
  coordinates: {
    latitude: number
    longitude: number
  }
  status: "Pending" | "In Progress" | "Resolved" | "Rejected"
  originalImageUrl: string
  finalImageUrl: string
  heliaDID?: string
  mlDetections?: any[]
  mlPriority?: string
  mlConfidence?: number
  totalDetections?: number
  createdAt: string
  updatedAt: string
  userId?: string
  images?: string[] // Legacy field for compatibility
  locationDetails?: LocationDetails
}

export interface DashboardSummary {
  total: number
  byType: {
    pothole: number
    garbage: number
    fallenTree: number
    brokenSign: number
    streetLight: number
    graffiti: number
  }
  byStatus: {
    pending: number
    inProgress: number
    resolved: number
    rejected: number
  }
}

export interface DashboardResponse {
  success: boolean
  message: string
  data: {
    summary: DashboardSummary
    complaints: IssueReport[]
  }
}

export type IssueType = "pothole" | "street-light" | "garbage" | "broken-sign" | "fallen-tree" | "graffiti"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNo: string
}
