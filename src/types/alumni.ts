// Alumni Profile interface from API
export interface AlumniProfile {
  id: number;
  user_id: number;
  graduation_year: number | null;
  degree: string | null;
  major: string | null;
  current_position: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

// Request payload for updating alumni profile
export interface UpdateAlumniProfileRequest {
  graduation_year?: number | null;
  degree?: string | null;
  major?: string | null;
  current_position?: string | null;
  company?: string | null;
  location?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website?: string | null;
}

// Parameters for listing alumni profiles
export interface ListAlumniParams {
  skip?: number;
  limit?: number;
}

// Service response wrapper for consistent state handling
export interface AlumniServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

// Frontend-friendly alumni profile interface
export interface FrontendAlumniProfile {
  id: number;
  userId: number;
  graduationYear: number | null;
  degree: string | null;
  major: string | null;
  currentPosition: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper function to map API response to frontend format
export function mapAlumniProfileToFrontend(profile: AlumniProfile): FrontendAlumniProfile {
  return {
    id: profile.id,
    userId: profile.user_id,
    graduationYear: profile.graduation_year,
    degree: profile.degree,
    major: profile.major,
    currentPosition: profile.current_position,
    company: profile.company,
    location: profile.location,
    bio: profile.bio,
    linkedinUrl: profile.linkedin_url,
    githubUrl: profile.github_url,
    website: profile.website,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

// Helper function to map frontend format to API request
export function mapFrontendToUpdateRequest(profile: Partial<FrontendAlumniProfile>): UpdateAlumniProfileRequest {
  return {
    graduation_year: profile.graduationYear,
    degree: profile.degree,
    major: profile.major,
    current_position: profile.currentPosition,
    company: profile.company,
    location: profile.location,
    bio: profile.bio,
    linkedin_url: profile.linkedinUrl,
    github_url: profile.githubUrl,
    website: profile.website,
  };
}
