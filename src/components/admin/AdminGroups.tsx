import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UsersRound, Edit, Trash2, Plus, Users, Search, RefreshCw, MessageSquare, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GroupModal from '@/components/GroupModal';
import { groupsApi } from '@/api/groups';
import { adminApi } from '@/api/admin';
import type { GroupResponse } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  members: number;
  description: string;
  isPrivate: boolean;
  category: string;
  avatar?: string;
  isJoined?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const transformGroup = (apiGroup: GroupResponse): Group => ({
  id: apiGroup.id,
  name: apiGroup.name,
  members: apiGroup.members,
  description: apiGroup.description || '',
  isPrivate: apiGroup.is_private,
  category: apiGroup.category || 'General',
  avatar: apiGroup.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${apiGroup.name}`,
  isJoined: apiGroup.is_joined,
  lastMessage: apiGroup.last_message,
  lastMessageTime: apiGroup.last_message_time,
  unreadCount: apiGroup.unread_count,
});

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joined_at?: string;
}

interface AlumniUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const AdminGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Member management states
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableAlumni, setAvailableAlumni] = useState<AlumniUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    if (!user?.universityId) return;
    
    setIsLoading(true);
    try {
      const response = await groupsApi.getGroups({
        page_size: 100,
        university_id: user.universityId
      });
      setGroups(response.groups.map(transformGroup));
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.universityId, toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleDelete = async (groupId: string, groupName: string) => {
    if (window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      try {
        await groupsApi.deleteGroup(groupId);
        setGroups(prev => prev.filter(g => g.id !== groupId));
        toast({
          title: 'Group deleted',
          description: 'The group has been removed',
        });
      } catch (error) {
        console.error('Failed to delete group:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete group',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleView = (group: Group) => {
    setSelectedGroup(group);
    setIsViewModalOpen(true);
  };

  // Open members management modal
  const handleManageMembers = async (group: Group) => {
    setSelectedGroup(group);
    setIsMembersModalOpen(true);
    setIsLoadingMembers(true);
    setMemberSearchQuery('');
    
    try {
      // Fetch group members
      const membersResponse = await groupsApi.getGroupMembers(group.id);
      setGroupMembers(membersResponse.members || []);
      
      // Fetch available alumni (not in the group)
      const alumniResponse = await adminApi.getUsers({ page: 1, page_size: 100 });
      const memberIds = new Set((membersResponse.members || []).map((m: GroupMember) => m.id));
      setAvailableAlumni(
        alumniResponse.users
          .filter(u => !memberIds.has(u.id))
          .map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
          }))
      );
    } catch (error) {
      console.error('Failed to load members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Add member to group
  const handleAddMember = async (alumniId: string) => {
    if (!selectedGroup) return;
    
    setIsAddingMember(true);
    try {
      await groupsApi.addMember(selectedGroup.id, alumniId);
      
      // Move alumni from available to members
      const addedAlumni = availableAlumni.find(a => a.id === alumniId);
      if (addedAlumni) {
        setGroupMembers(prev => [...prev, { ...addedAlumni, joined_at: new Date().toISOString() }]);
        setAvailableAlumni(prev => prev.filter(a => a.id !== alumniId));
      }
      
      // Update group member count
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id ? { ...g, members: g.members + 1 } : g
      ));
      
      toast({
        title: 'Member added',
        description: `${addedAlumni?.name} has been added to the group`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.detail || 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove member from group
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    
    setIsRemovingMember(memberId);
    try {
      await groupsApi.removeMember(selectedGroup.id, memberId);
      
      // Move member back to available alumni
      const removedMember = groupMembers.find(m => m.id === memberId);
      if (removedMember) {
        setAvailableAlumni(prev => [...prev, { id: removedMember.id, name: removedMember.name, email: removedMember.email, avatar: removedMember.avatar }]);
        setGroupMembers(prev => prev.filter(m => m.id !== memberId));
      }
      
      // Update group member count
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id ? { ...g, members: Math.max(0, g.members - 1) } : g
      ));
      
      toast({
        title: 'Member removed',
        description: `${removedMember?.name} has been removed from the group`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.detail || 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingMember(null);
    }
  };

  // Filter available alumni by search
  const filteredAvailableAlumni = availableAlumni.filter(alumni =>
    alumni.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    alumni.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const handleCreateOrUpdate = async (groupData: Omit<Group, 'id' | 'members' | 'isJoined'>) => {
    try {
      if (editingGroup) {
        const response = await groupsApi.updateGroup(editingGroup.id, {
          name: groupData.name,
          description: groupData.description,
          category: groupData.category,
          is_private: groupData.isPrivate,
          avatar: groupData.avatar,
        });
        setGroups(prev => prev.map(g => g.id === editingGroup.id ? transformGroup(response) : g));
        toast({
          title: 'Group updated',
          description: 'Group details have been updated successfully',
        });
      } else {
        const response = await groupsApi.createGroup({
          name: groupData.name,
          description: groupData.description,
          category: groupData.category,
          is_private: groupData.isPrivate,
          avatar: groupData.avatar,
        });
        setGroups(prev => [transformGroup(response), ...prev]);
        toast({
          title: 'Group created',
          description: 'Your new group has been created successfully',
        });
      }
      setIsModalOpen(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Failed to save group:', error);
      toast({
        title: 'Error',
        description: 'Failed to save group',
        variant: 'destructive',
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = groups.reduce((sum, g) => sum + g.members, 0);
  const avgMembers = groups.length > 0 ? Math.round(totalMembers / groups.length) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded flex-1"></div>
                <div className="h-8 bg-muted rounded flex-1"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Group Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage alumni groups for your university
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadGroups} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <p className="text-2xl font-bold text-blue-600">{groups.length}</p>
            <p className="text-sm text-muted-foreground">Total Groups</p>
          </div>
          <div className="p-4 rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/5">
            <p className="text-2xl font-bold text-green-600">{totalMembers}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
          <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <p className="text-2xl font-bold text-purple-600">{avgMembers}</p>
            <p className="text-sm text-muted-foreground">Avg Members/Group</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.length === 0 ? (
          <Card className="p-10 text-center col-span-full border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <UsersRound className="w-7 h-7 text-primary/60" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No Groups Found' : 'No Groups Yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-5">
                {searchQuery 
                  ? `No groups match "${searchQuery}". Try a different search term.`
                  : 'Create alumni groups to foster community engagement around shared interests or graduation years.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Group
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredGroups.map(group => (
            <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10">
                  <img 
                    src={group.avatar} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate mb-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{group.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{group.members} members</span>
                </div>
              </div>

              {group.lastMessage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                  <MessageSquare className="w-3 h-3" />
                  <span className="truncate">{group.lastMessage}</span>
                  {group.lastMessageTime && (
                    <span className="flex-shrink-0">• {group.lastMessageTime}</span>
                  )}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleManageMembers(group)} className="flex-1">
                  <Users className="w-4 h-4 mr-1" />
                  Members
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(group)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(group.id, group.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* View Group Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGroup?.avatar && (
                <img 
                  src={selectedGroup.avatar} 
                  alt={selectedGroup.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  {selectedGroup?.name}
                </div>
                <p className="text-sm text-muted-foreground font-normal">{selectedGroup?.category}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedGroup.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">{selectedGroup.members}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">{selectedGroup.category}</p>
                  <p className="text-sm text-muted-foreground">Category</p>
                </div>
              </div>

              {selectedGroup.lastMessage && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Last Activity
                  </h4>
                  <p className="text-sm">{selectedGroup.lastMessage}</p>
                  {selectedGroup.lastMessageTime && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedGroup.lastMessageTime}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => { setIsViewModalOpen(false); handleManageMembers(selectedGroup); }} className="flex-1">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Members
                </Button>
                <Button onClick={() => { setIsViewModalOpen(false); handleEdit(selectedGroup); }} variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Group
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members Management Modal */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              Manage Members - {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove alumni from this group
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Current Members */}
              <div className="border rounded-lg p-4 flex flex-col max-h-[400px]">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UsersRound className="w-4 h-4" />
                  Current Members ({groupMembers.length})
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {groupMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                  ) : (
                    groupMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted">
                        <div className="flex items-center gap-2 min-w-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isRemovingMember === member.id}
                        >
                          {isRemovingMember === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Members */}
              <div className="border rounded-lg p-4 flex flex-col max-h-[400px]">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Alumni
                </h4>
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alumni..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredAvailableAlumni.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {memberSearchQuery ? 'No alumni found' : 'All alumni are already members'}
                    </p>
                  ) : (
                    filteredAvailableAlumni.slice(0, 50).map(alumni => (
                      <div key={alumni.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-2 min-w-0">
                          {alumni.avatar ? (
                            <img src={alumni.avatar} alt={alumni.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {alumni.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{alumni.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{alumni.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary h-8 w-8 p-0"
                          onClick={() => handleAddMember(alumni.id)}
                          disabled={isAddingMember}
                        >
                          {isAddingMember ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <GroupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editGroup={editingGroup}
      />
    </div>
  );
};

export default AdminGroups;
