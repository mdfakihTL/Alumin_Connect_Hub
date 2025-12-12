// Common API response types

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// User types
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  university_id?: string;
  graduation_year?: number;
  major?: string;
  role: 'alumni' | 'admin' | 'superadmin';
  is_mentor: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  bio?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  company?: string;
  linkedin?: string;
  website?: string;
  banner?: string;
  connections_count: number;
  posts_count: number;
  experience?: string;
  education?: string;
}

export interface UserWithProfileResponse extends UserResponse {
  profile?: UserProfileResponse;
  university_name?: string;
}

// University branding types
export interface UniversityColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface UniversityBrandingColors {
  light: UniversityColors;
  dark: UniversityColors;
}

export interface UniversityBrandingResponse {
  id: string;
  name: string;
  logo?: string;
  colors?: UniversityBrandingColors;
  is_enabled?: boolean;
}

export interface UniversityResponse {
  id: string;
  name: string;
  logo?: string;
  is_enabled: boolean;
  colors?: UniversityBrandingColors;
  created_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  university_id?: string;
  graduation_year?: number;
  major?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  university_branding?: UniversityBrandingResponse;
  universities?: UniversityBrandingResponse[]; // For superadmin
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

// Post types
export interface AuthorResponse {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  company?: string;
}

export interface CommentResponse {
  id: string;
  author: AuthorResponse;
  content: string;
  created_at: string;
}

export interface PostResponse {
  id: string;
  author: AuthorResponse;
  type: 'text' | 'image' | 'video' | 'job' | 'announcement';
  content: string;
  media_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  tag?: string;
  job_title?: string;
  company?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  time: string;
  created_at: string;
}

export interface PostCreateRequest {
  type?: string;
  content: string;
  media_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  tag?: string;
  job_title?: string;
  company?: string;
  location?: string;
}

export interface PostListResponse {
  posts: PostResponse[];
  total: number;
  page: number;
  page_size: number;
}

// Event types
export interface EventResponse {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  attendees: number;
  image?: string;
  description?: string;
  is_virtual: boolean;
  meeting_link?: string;
  organizer: string;
  category?: string;
  is_registered: boolean;
  created_at: string;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  image?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  category?: string;
  max_attendees?: number;
}

export interface EventListResponse {
  events: EventResponse[];
  total: number;
  page: number;
  page_size: number;
}

// Group types
export interface GroupResponse {
  id: string;
  name: string;
  members: number;
  description?: string;
  is_private: boolean;
  category?: string;
  avatar?: string;
  is_joined: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  created_at: string;
}

export interface GroupCreateRequest {
  name: string;
  description?: string;
  category?: string;
  is_private?: boolean;
  avatar?: string;
}

export interface GroupListResponse {
  groups: GroupResponse[];
  total: number;
  page: number;
  page_size: number;
}

// Connection types
export interface ConnectionUserResponse {
  id: string;
  name: string;
  avatar: string;
  university?: string;
  year?: string;
  major?: string;
  job_title?: string;
  company?: string;
}

export interface ConnectionResponse {
  id: string;
  user: ConnectionUserResponse;
  connected_date: string;
}

export interface ConnectionListResponse {
  connections: ConnectionResponse[];
  total: number;
}

export interface ConnectionRequestFromUser {
  id: string;
  name: string;
  avatar?: string;
  university?: string;
  year?: string;
}

export interface ConnectionRequestResponse {
  id: string;
  from_user: ConnectionRequestFromUser;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

// Message types
export interface ConversationUserResponse {
  id: string;
  name: string;
  avatar?: string;
}

export interface ConversationResponse {
  id: string;
  user: ConversationUserResponse;
  last_message?: string;
  time?: string;
  unread: number;
  is_group: boolean;
}

export interface MessageResponse {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  is_own: boolean;
}

export interface ConversationMessagesResponse {
  conversation: ConversationResponse;
  messages: MessageResponse[];
}

// Support types
export interface TicketResponseItem {
  id: string;
  message: string;
  responder_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface SupportTicketResponse {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
  responses: TicketResponseItem[];
}

export interface SupportTicketCreateRequest {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

export interface SupportTicketListResponse {
  tickets: SupportTicketResponse[];
  total: number;
  page: number;
  page_size: number;
}

// Notification types
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  avatar?: string;
  read: boolean;
  time: string;
  created_at: string;
  action_url?: string;
  related_id?: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
}

// Fundraiser types
export interface FundraiserResponse {
  id: string;
  university_id: string;
  title: string;
  description?: string;
  image?: string;
  goal_amount: number;
  current_amount: number;
  donation_link?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

// Ad types
export interface AdResponse {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  placement: string;
  is_active: boolean;
}

// Document types
export interface DocumentRequestResponse {
  id: string;
  document_type: string;
  reason?: string;
  status: string;
  requested_at: string;
  estimated_completion?: string;
}

export interface GeneratedDocumentResponse {
  id: string;
  document_type: string;
  title: string;
  content?: string;
  generated_at: string;
}

// Mentor types
export interface MentorResponse {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  expertise: string[];
  availability: string;
  years_experience: number;
  mentees_count: number;
  match_score: number;
}

