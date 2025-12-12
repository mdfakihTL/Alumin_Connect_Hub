import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { groupsApi } from '@/api/groups';
import { handleApiError } from '@/api/client';
import { useAuth } from './AuthContext';
import type { GroupResponse } from '@/api/types';

export interface Group {
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

interface GroupsContextType {
  groups: Group[];
  joinedGroups: Group[];
  isLoading: boolean;
  error: string | null;
  createGroup: (group: Omit<Group, 'id' | 'members' | 'isJoined'>) => Promise<void>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  joinGroup: (id: string) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

// Transform API response to frontend format
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

export const GroupsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGroups = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await groupsApi.getGroups({ page_size: 100 });
      setGroups(response.groups.map(transformGroup));
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load groups when user is authenticated
  useEffect(() => {
    if (user) {
      refreshGroups();
    } else {
      setGroups([]);
    }
  }, [user, refreshGroups]);

  const joinedGroups = groups.filter(g => g.isJoined);

  const createGroup = async (groupData: Omit<Group, 'id' | 'members' | 'isJoined'>) => {
    try {
      const response = await groupsApi.createGroup({
        name: groupData.name,
        description: groupData.description,
        category: groupData.category,
        is_private: groupData.isPrivate,
        avatar: groupData.avatar,
      });
      
      setGroups(prev => [transformGroup(response), ...prev]);
    } catch (err) {
      handleApiError(err, 'Failed to create group');
      throw err;
    }
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      const response = await groupsApi.updateGroup(id, {
        name: updates.name,
        description: updates.description,
        category: updates.category,
        is_private: updates.isPrivate,
        avatar: updates.avatar,
      });
      
      setGroups(prev => prev.map(group => 
        group.id === id ? transformGroup(response) : group
      ));
    } catch (err) {
      handleApiError(err, 'Failed to update group');
      throw err;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await groupsApi.deleteGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
    } catch (err) {
      handleApiError(err, 'Failed to delete group');
      throw err;
    }
  };

  const joinGroup = async (id: string) => {
    try {
      await groupsApi.joinGroup(id);
      setGroups(prev => prev.map(group => 
        group.id === id 
          ? { ...group, isJoined: true, members: group.members + 1 } 
          : group
      ));
    } catch (err) {
      handleApiError(err, 'Failed to join group');
      throw err;
    }
  };

  const leaveGroup = async (id: string) => {
    try {
      await groupsApi.leaveGroup(id);
      setGroups(prev => prev.map(group => 
        group.id === id 
          ? { ...group, isJoined: false, members: Math.max(0, group.members - 1) } 
          : group
      ));
    } catch (err) {
      handleApiError(err, 'Failed to leave group');
      throw err;
    }
  };

  return (
    <GroupsContext.Provider value={{
      groups,
      joinedGroups,
      isLoading,
      error,
      createGroup,
      updateGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      refreshGroups,
    }}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within GroupsProvider');
  }
  return context;
};
