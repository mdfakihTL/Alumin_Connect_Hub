import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import GroupModal from '@/components/GroupModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Search, Lock, Settings, LogOut, Edit, Trash2, Check, Menu } from 'lucide-react';
import { useGroups, Group } from '@/contexts/GroupsContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Groups = () => {
  const { groups, joinedGroups, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup } = useGroups();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [filter, setFilter] = useState<'all' | 'joined'>('all');

  const filteredGroups = groups.filter(group => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || (filter === 'joined' && group.isJoined);
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateGroup = (groupData: Omit<Group, 'id' | 'members' | 'isJoined'>) => {
    createGroup(groupData);
    toast({
      title: 'Group created!',
      description: 'Your new group has been created successfully',
    });
    setIsModalOpen(false);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleUpdateGroup = (groupData: Omit<Group, 'id' | 'members' | 'isJoined'>) => {
    if (editingGroup) {
      updateGroup(editingGroup.id, groupData);
      toast({
        title: 'Group updated!',
        description: 'Group details have been updated successfully',
      });
      setEditingGroup(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteGroup = (groupId: number, groupName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`);
    if (confirmed) {
      deleteGroup(groupId);
      toast({
        title: 'Group deleted',
        description: 'The group has been removed',
      });
    }
  };

  const handleJoinGroup = (groupId: number, groupName: string) => {
    joinGroup(groupId);
    toast({
      title: 'Joined group!',
      description: `You are now a member of ${groupName}`,
    });
  };

  const handleLeaveGroup = (groupId: number, groupName: string) => {
    const confirmed = window.confirm(`Are you sure you want to leave "${groupName}"?`);
    if (confirmed) {
      leaveGroup(groupId);
      toast({
        title: 'Left group',
        description: `You have left ${groupName}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 flex-shrink-0"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1">Groups</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Connect with alumni communities</p>
              </div>
            </div>
            <Button className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Group</span>
            </Button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search groups..." 
                  className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'joined')}>
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All Groups ({groups.length})
                </TabsTrigger>
                <TabsTrigger value="joined" className="text-xs sm:text-sm">
                  My Groups ({joinedGroups.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : filter === 'joined'
                    ? "You haven't joined any groups yet"
                    : "Be the first to create a group!"}
              </p>
              {!searchQuery && filter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Group
                </Button>
              )}
            </Card>
          )}

          {/* Groups Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredGroups.map((group) => {
              const isOwner = group.isJoined && group.id >= 1000; // User created groups
              
              return (
                <Card key={group.id} className="p-5 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10">
                        <img 
                          src={group.avatar} 
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{group.name}</h3>
                            {group.isPrivate && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          </div>
                          {isOwner && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEditGroup(group)} className="gap-2">
                                  <Edit className="w-4 h-4" />
                                  Edit Group
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                          {group.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {group.members}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {group.isJoined ? (
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" variant="outline">
                        <Check className="w-4 h-4" />
                        Joined
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleLeaveGroup(group.id, group.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleJoinGroup(group.id, group.name)}
                    >
                      <Plus className="w-4 h-4" />
                      Join Group
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Group Modal */}
      <GroupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
        editGroup={editingGroup}
      />
    </div>
  );
};

export default Groups;
