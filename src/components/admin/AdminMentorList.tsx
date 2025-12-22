import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, MentorResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Shield, Mail, Phone, Award, Grid3x3, Table2, Filter, X, GraduationCap, RefreshCw, Loader2, User, UserMinus, MapPin, Briefcase, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Mentor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  company?: string;
  major?: string;
  graduationYear?: string;
  location?: string;
  phone?: string;
  bio?: string;
}

const AdminMentorList = () => {
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMentors, setTotalMentors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    major: '',
    graduationYear: '',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const itemsPerPage = 12;

  // Profile modal states
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRemovingMentor, setIsRemovingMentor] = useState(false);

  // Handle view profile button click
  const handleViewProfile = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsProfileModalOpen(true);
  };

  // Handle remove mentor status
  const handleRemoveMentor = async (mentor: Mentor) => {
    setIsRemovingMentor(true);
    try {
      // Call API to remove mentor status
      await apiClient.request(`/users/${mentor.id}/mentor-status`, {
        method: 'PUT',
        body: JSON.stringify({ is_mentor: false }),
      });
      
      toast({
        title: 'Mentor Status Removed',
        description: `${mentor.name} is no longer a mentor`,
      });
      
      // Remove from list and refresh
      setMentors(prev => prev.filter(m => m.id !== mentor.id));
      setTotalMentors(prev => prev - 1);
      setIsProfileModalOpen(false);
      setSelectedMentor(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.detail || 'Failed to remove mentor status',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingMentor(false);
    }
  };

  // Fetch mentors from API
  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getMentors({
        page: currentPage,
        page_size: itemsPerPage,
        search: searchQuery || undefined,
      });
      
      const formattedMentors: Mentor[] = response.mentors.map((m: MentorResponse) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        title: m.title,
        company: m.company,
        major: m.major,
        graduationYear: m.graduation_year,
        location: m.location,
        phone: m.phone,
        bio: m.bio,
      }));
      
      setMentors(formattedMentors);
      setTotalMentors(response.total);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [currentPage, searchQuery]);

  // Filter mentors based on all filter criteria (client-side for additional filters)
  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      const nameMatch = !filters.name || mentor.name.toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = !filters.email || mentor.email.toLowerCase().includes(filters.email.toLowerCase());
      const majorMatch = !filters.major || (mentor.major?.toLowerCase().includes(filters.major.toLowerCase()));
      const yearMatch = !filters.graduationYear || (mentor.graduationYear?.includes(filters.graduationYear));
      
      return nameMatch && emailMatch && majorMatch && yearMatch;
    });
  }, [mentors, filters]);

  // Pagination
  const totalPages = Math.ceil(totalMentors / itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      name: '',
      email: '',
      major: '',
      graduationYear: '',
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.name) count++;
    if (filters.email) count++;
    if (filters.major) count++;
    if (filters.graduationYear) count++;
    return count;
  };

  // Sync tempFilters when modal opens
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempFilters(filters);
    }
  }, [isFilterModalOpen]);

  if (isLoading && mentors.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Active Mentors</h2>
              <p className="text-sm text-muted-foreground">
                Alumni who are available to mentor current students and other alumni
              </p>
            </div>
          </div>
        </Card>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading mentors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Active Mentors</h2>
            <p className="text-sm text-muted-foreground">
              Alumni who are available to mentor current students and other alumni
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchMentors()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {totalMentors} Mentors
            </Badge>
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <Table2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-between mb-6">
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filter Mentors</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search name..."
                        value={tempFilters.name}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search email..."
                        value={tempFilters.email}
                        onChange={(e) => handleFilterChange('email', e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <Input
                      placeholder="Search major..."
                      value={tempFilters.major}
                      onChange={(e) => handleFilterChange('major', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input
                      placeholder="Search year..."
                      value={tempFilters.graduationYear}
                      onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.length === 0 ? (
              <Card className="p-10 text-center col-span-full border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-primary/60" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Mentors Found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {getActiveFilterCount() > 0 || searchQuery ? 'No mentors match your filters. Try adjusting your search.' : 'No alumni have registered as mentors yet.'}
                  </p>
                </div>
              </Card>
            ) : (
              filteredMentors.map(mentor => (
                <Card key={mentor.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    {mentor.avatar ? (
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {mentor.title ? `${mentor.title}${mentor.company ? ` at ${mentor.company}` : ''}` : mentor.major || 'Mentor'}
                      </p>
                      {mentor.graduationYear && (
                        <Badge variant="outline" className="mt-2">
                          <Award className="w-3 h-3 mr-1" />
                          Class of {mentor.graduationYear}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{mentor.email}</span>
                    </div>
                    {mentor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{mentor.phone}</span>
                      </div>
                    )}
                  </div>

                  <Button size="sm" className="w-full" onClick={() => handleViewProfile(mentor)}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination for Cards View */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Graduation Year</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Search className="w-5 h-5 text-primary/60" />
                          </div>
                        </div>
                        <h4 className="font-medium mb-1">No Mentors Found</h4>
                        <p className="text-sm text-muted-foreground">
                          {getActiveFilterCount() > 0 || searchQuery ? 'No mentors match your filters.' : 'No mentors available'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMentors.map(mentor => (
                    <TableRow key={mentor.id}>
                      <TableCell className="font-medium">{mentor.name}</TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>{mentor.phone || '-'}</TableCell>
                      <TableCell>{mentor.title || mentor.major || '-'}</TableCell>
                      <TableCell>
                        {mentor.graduationYear ? (
                          <Badge variant="outline">
                            <Award className="w-3 h-3 mr-1" />
                            {mentor.graduationYear}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{mentor.location || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleViewProfile(mentor)}>
                          <User className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      )}

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Mentor Profile
            </DialogTitle>
          </DialogHeader>
          {selectedMentor && (
            <div className="space-y-4 mt-4">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                {selectedMentor.avatar ? (
                  <img src={selectedMentor.avatar} alt={selectedMentor.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMentor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedMentor.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedMentor.title ? `${selectedMentor.title}${selectedMentor.company ? ` at ${selectedMentor.company}` : ''}` : 'Mentor'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default" className="gap-1">
                      <Shield className="w-3 h-3" />
                      Mentor
                    </Badge>
                    {selectedMentor.graduationYear && (
                      <Badge variant="outline" className="gap-1">
                        <Award className="w-3 h-3" />
                        Class of {selectedMentor.graduationYear}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{selectedMentor.email}</p>
                  </div>
                </div>
                {selectedMentor.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{selectedMentor.phone}</p>
                    </div>
                  </div>
                )}
                {selectedMentor.title && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Job Title</p>
                      <p className="text-sm font-medium">{selectedMentor.title}</p>
                    </div>
                  </div>
                )}
                {selectedMentor.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-medium">{selectedMentor.company}</p>
                    </div>
                  </div>
                )}
                {selectedMentor.major && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Major</p>
                      <p className="text-sm font-medium">{selectedMentor.major}</p>
                    </div>
                  </div>
                )}
                {selectedMentor.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{selectedMentor.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {selectedMentor.bio && (
                <div className="space-y-2">
                  <h4 className="font-medium">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedMentor.bio}</p>
                </div>
              )}

              {/* Remove Mentor Action */}
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleRemoveMentor(selectedMentor)}
                  disabled={isRemovingMentor}
                >
                  {isRemovingMentor ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserMinus className="w-4 h-4 mr-2" />
                  )}
                  Remove from Mentor Position
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This will revoke their mentor status. They can re-apply to become a mentor again.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentorList;
