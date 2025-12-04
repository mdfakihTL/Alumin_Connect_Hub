export interface AlumniLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  universityId: string;
  graduationYear: number;
  major: string;
  currentPosition?: string;
  company?: string;
}

// MIT Alumni Locations
export const mitAlumniLocations: AlumniLocation[] = [
  // USA - East Coast
  { id: 'm1', name: 'Sarah Chen', city: 'Boston', country: 'USA', coordinates: { lat: 42.3601, lng: -71.0589 }, universityId: 'mit', graduationYear: 2019, major: 'Computer Science', currentPosition: 'Senior Engineer', company: 'Google' },
  { id: 'm2', name: 'John Doe', city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 }, universityId: 'mit', graduationYear: 2020, major: 'Electrical Engineering', currentPosition: 'Tech Lead', company: 'Microsoft' },
  { id: 'm3', name: 'Emily Rodriguez', city: 'Washington DC', country: 'USA', coordinates: { lat: 38.9072, lng: -77.0369 }, universityId: 'mit', graduationYear: 2018, major: 'Political Science', currentPosition: 'Policy Analyst', company: 'Think Tank' },
  
  // USA - West Coast
  { id: 'm4', name: 'Michael Wang', city: 'San Francisco', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, universityId: 'mit', graduationYear: 2021, major: 'Data Science', currentPosition: 'ML Engineer', company: 'OpenAI' },
  { id: 'm5', name: 'Lisa Park', city: 'Seattle', country: 'USA', coordinates: { lat: 47.6062, lng: -122.3321 }, universityId: 'mit', graduationYear: 2017, major: 'Software Engineering', currentPosition: 'Principal Engineer', company: 'Amazon' },
  { id: 'm6', name: 'David Kim', city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lng: -118.2437 }, universityId: 'mit', graduationYear: 2019, major: 'Aerospace Engineering', currentPosition: 'Aerospace Engineer', company: 'SpaceX' },
  
  // USA - Other
  { id: 'm7', name: 'Amanda Lee', city: 'Austin', country: 'USA', coordinates: { lat: 30.2672, lng: -97.7431 }, universityId: 'mit', graduationYear: 2020, major: 'Computer Science', currentPosition: 'Startup Founder', company: 'TechStart' },
  { id: 'm8', name: 'James Wilson', city: 'Chicago', country: 'USA', coordinates: { lat: 41.8781, lng: -87.6298 }, universityId: 'mit', graduationYear: 2018, major: 'Finance', currentPosition: 'VP Finance', company: 'Trading Firm' },
  
  // Europe
  { id: 'm9', name: 'Sophie Brown', city: 'London', country: 'UK', coordinates: { lat: 51.5074, lng: -0.1278 }, universityId: 'mit', graduationYear: 2019, major: 'Business', currentPosition: 'Consultant', company: 'McKinsey' },
  { id: 'm10', name: 'Hans Mueller', city: 'Berlin', country: 'Germany', coordinates: { lat: 52.5200, lng: 13.4050 }, universityId: 'mit', graduationYear: 2020, major: 'Robotics', currentPosition: 'Robotics Engineer', company: 'BMW' },
  { id: 'm11', name: 'Marie Dubois', city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lng: 2.3522 }, universityId: 'mit', graduationYear: 2018, major: 'AI Research', currentPosition: 'Research Scientist', company: 'INRIA' },
  
  // Asia
  { id: 'm12', name: 'Yuki Tanaka', city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, universityId: 'mit', graduationYear: 2019, major: 'Electronics', currentPosition: 'Senior Engineer', company: 'Sony' },
  { id: 'm13', name: 'Wei Zhang', city: 'Shanghai', country: 'China', coordinates: { lat: 31.2304, lng: 121.4737 }, universityId: 'mit', graduationYear: 2020, major: 'Computer Science', currentPosition: 'Tech Director', company: 'Alibaba' },
  { id: 'm14', name: 'Priya Sharma', city: 'Bangalore', country: 'India', coordinates: { lat: 12.9716, lng: 77.5946 }, universityId: 'mit', graduationYear: 2021, major: 'Software Engineering', currentPosition: 'Engineering Manager', company: 'Infosys' },
  { id: 'm15', name: 'Kim Min-ji', city: 'Seoul', country: 'South Korea', coordinates: { lat: 37.5665, lng: 126.9780 }, universityId: 'mit', graduationYear: 2019, major: 'Electrical Engineering', currentPosition: 'Hardware Engineer', company: 'Samsung' },
  
  // Other regions
  { id: 'm16', name: 'Carlos Silva', city: 'São Paulo', country: 'Brazil', coordinates: { lat: -23.5505, lng: -46.6333 }, universityId: 'mit', graduationYear: 2018, major: 'Environmental Engineering', currentPosition: 'Environmental Consultant', company: 'EcoConsult' },
  { id: 'm17', name: 'Ahmed Hassan', city: 'Dubai', country: 'UAE', coordinates: { lat: 25.2048, lng: 55.2708 }, universityId: 'mit', graduationYear: 2020, major: 'Business', currentPosition: 'Business Development', company: 'Emirates Group' },
  { id: 'm18', name: 'Rachel Cohen', city: 'Tel Aviv', country: 'Israel', coordinates: { lat: 32.0853, lng: 34.7818 }, universityId: 'mit', graduationYear: 2019, major: 'Cybersecurity', currentPosition: 'Security Architect', company: 'Check Point' },
  { id: 'm19', name: 'Oliver Brown', city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lng: 151.2093 }, universityId: 'mit', graduationYear: 2021, major: 'Marine Biology', currentPosition: 'Research Scientist', company: 'CSIRO' },
  { id: 'm20', name: 'Isabella Rossi', city: 'Toronto', country: 'Canada', coordinates: { lat: 43.6532, lng: -79.3832 }, universityId: 'mit', graduationYear: 2018, major: 'AI/ML', currentPosition: 'ML Researcher', company: 'Vector Institute' },
];

// Stanford Alumni Locations
export const stanfordAlumniLocations: AlumniLocation[] = [
  // USA - West Coast (Stanford concentration)
  { id: 's1', name: 'Emily Johnson', city: 'San Francisco', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, universityId: 'stanford', graduationYear: 2018, major: 'Data Science', currentPosition: 'Data Scientist', company: 'Stripe' },
  { id: 's2', name: 'Michael Smith', city: 'San Jose', country: 'USA', coordinates: { lat: 37.3382, lng: -121.8863 }, universityId: 'stanford', graduationYear: 2021, major: 'Business', currentPosition: 'Product Manager', company: 'Apple' },
  { id: 's3', name: 'Jennifer Lee', city: 'Palo Alto', country: 'USA', coordinates: { lat: 37.4419, lng: -122.1430 }, universityId: 'stanford', graduationYear: 2019, major: 'Computer Science', currentPosition: 'Software Engineer', company: 'Meta' },
  { id: 's4', name: 'Robert Chen', city: 'Mountain View', country: 'USA', coordinates: { lat: 37.3861, lng: -122.0839 }, universityId: 'stanford', graduationYear: 2020, major: 'AI Research', currentPosition: 'Research Engineer', company: 'Google' },
  { id: 's5', name: 'Sarah Martinez', city: 'Oakland', country: 'USA', coordinates: { lat: 37.8044, lng: -122.2712 }, universityId: 'stanford', graduationYear: 2019, major: 'Social Impact', currentPosition: 'Program Director', company: 'Non-Profit' },
  { id: 's6', name: 'Alex Wong', city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lng: -118.2437 }, universityId: 'stanford', graduationYear: 2021, major: 'Film Production', currentPosition: 'Producer', company: 'Netflix' },
  { id: 's7', name: 'Jessica Brown', city: 'Seattle', country: 'USA', coordinates: { lat: 47.6062, lng: -122.3321 }, universityId: 'stanford', graduationYear: 2018, major: 'E-Commerce', currentPosition: 'Director', company: 'Amazon' },
  
  // USA - Other
  { id: 's8', name: 'Christopher Davis', city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 }, universityId: 'stanford', graduationYear: 2020, major: 'Finance', currentPosition: 'Investment Banker', company: 'Goldman Sachs' },
  { id: 's9', name: 'Michelle Garcia', city: 'Austin', country: 'USA', coordinates: { lat: 30.2672, lng: -97.7431 }, universityId: 'stanford', graduationYear: 2019, major: 'Entrepreneurship', currentPosition: 'CEO', company: 'Startup' },
  { id: 's10', name: 'Daniel Kim', city: 'Boston', country: 'USA', coordinates: { lat: 42.3601, lng: -71.0589 }, universityId: 'stanford', graduationYear: 2018, major: 'Biotech', currentPosition: 'Biotech Researcher', company: 'Moderna' },
  
  // International
  { id: 's11', name: 'Laura Schmidt', city: 'London', country: 'UK', coordinates: { lat: 51.5074, lng: -0.1278 }, universityId: 'stanford', graduationYear: 2020, major: 'International Relations', currentPosition: 'Diplomat', company: 'UN' },
  { id: 's12', name: 'Thomas Anderson', city: 'Singapore', country: 'Singapore', coordinates: { lat: 1.3521, lng: 103.8198 }, universityId: 'stanford', graduationYear: 2019, major: 'Finance', currentPosition: 'Investment Manager', company: 'Temasek' },
  { id: 's13', name: 'Anna Kowalski', city: 'Warsaw', country: 'Poland', coordinates: { lat: 52.2297, lng: 21.0122 }, universityId: 'stanford', graduationYear: 2021, major: 'Engineering', currentPosition: 'Engineer', company: 'Tech Company' },
  { id: 's14', name: 'David Thompson', city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lng: 151.2093 }, universityId: 'stanford', graduationYear: 2018, major: 'Environmental Science', currentPosition: 'Environmental Consultant', company: 'GHD' },
  { id: 's15', name: 'Maria Rodriguez', city: 'Mexico City', country: 'Mexico', coordinates: { lat: 19.4326, lng: -99.1332 }, universityId: 'stanford', graduationYear: 2020, major: 'Public Policy', currentPosition: 'Policy Advisor', company: 'Government' },
  { id: 's16', name: 'Raj Patel', city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lng: 72.8777 }, universityId: 'stanford', graduationYear: 2019, major: 'Business', currentPosition: 'Entrepreneur', company: 'Own Business' },
  { id: 's17', name: 'Emma Wilson', city: 'Vancouver', country: 'Canada', coordinates: { lat: 49.2827, lng: -123.1207 }, universityId: 'stanford', graduationYear: 2021, major: 'Environmental Studies', currentPosition: 'Sustainability Consultant', company: 'Green Firm' },
  { id: 's18', name: 'Lucas Santos', city: 'Rio de Janeiro', country: 'Brazil', coordinates: { lat: -22.9068, lng: -43.1729 }, universityId: 'stanford', graduationYear: 2018, major: 'Marketing', currentPosition: 'Marketing Director', company: 'Global Brand' },
];

export const getAllAlumniLocations = (universityId?: string): AlumniLocation[] => {
  if (!universityId) {
    return [...mitAlumniLocations, ...stanfordAlumniLocations];
  }
  
  return universityId === 'mit' ? mitAlumniLocations : stanfordAlumniLocations;
};

// Function to get alumni count by location
export const getAlumniByLocation = (universityId: string): Map<string, AlumniLocation[]> => {
  const locations = getAllAlumniLocations(universityId);
  const locationMap = new Map<string, AlumniLocation[]>();
  
  locations.forEach(alumni => {
    const key = `${alumni.coordinates.lat},${alumni.coordinates.lng}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, []);
    }
    locationMap.get(key)!.push(alumni);
  });
  
  return locationMap;
};

