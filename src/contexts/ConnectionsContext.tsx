import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { connectionsApi } from '@/api/connections';
import { handleApiError } from '@/api/client';
import { useAuth } from './AuthContext';
import type { ConnectionResponse, ConnectionRequestResponse } from '@/api/types';

export interface Connection {
  id: string;
  name: string;
  avatar: string;
  university: string;
  year: string;
  major: string;
  jobTitle: string;
  company: string;
  connectedDate: string;
}

export interface ConnectionRequest {
  id: string;
  from: {
    id: string;
    name: string;
    avatar: string;
    university: string;
    year: string;
  };
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

interface ConnectionsContextType {
  connections: Connection[];
  sentRequests: ConnectionRequest[];
  receivedRequests: ConnectionRequest[];
  isLoading: boolean;
  error: string | null;
  isConnected: (userId: string) => boolean;
  hasPendingRequest: (userId: string) => boolean;
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  refreshConnections: () => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

// Transform API response to frontend format
const transformConnection = (apiConn: ConnectionResponse): Connection => ({
  id: apiConn.id,
  name: apiConn.user.name,
  avatar: apiConn.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiConn.user.name}`,
  university: apiConn.user.university || 'University',
  year: apiConn.user.year || '',
  major: apiConn.user.major || '',
  jobTitle: apiConn.user.job_title || '',
  company: apiConn.user.company || '',
  connectedDate: apiConn.connected_date,
});

const transformRequest = (apiReq: ConnectionRequestResponse): ConnectionRequest => ({
  id: apiReq.id,
  from: {
    id: apiReq.from_user.id,
    name: apiReq.from_user.name,
    avatar: apiReq.from_user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiReq.from_user.name}`,
    university: apiReq.from_user.university || 'University',
    year: apiReq.from_user.year || '',
  },
  to: apiReq.to_user_id,
  status: apiReq.status,
  date: apiReq.date,
});

export const ConnectionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConnections = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [connectionsRes, receivedRes, sentRes] = await Promise.all([
        connectionsApi.getConnections({ page_size: 100 }),
        connectionsApi.getReceivedRequests(),
        connectionsApi.getSentRequests(),
      ]);
      
      setConnections(connectionsRes.connections.map(transformConnection));
      setReceivedRequests(receivedRes.requests.map(transformRequest));
      setSentRequests(sentRes.requests.map(transformRequest));
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setError('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load connections when user is authenticated
  useEffect(() => {
    if (user) {
      refreshConnections();
    } else {
      setConnections([]);
      setSentRequests([]);
      setReceivedRequests([]);
    }
  }, [user, refreshConnections]);

  const isConnected = (userId: string) => {
    return connections.some(c => c.id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(r => r.to === userId && r.status === 'pending');
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      await connectionsApi.sendRequest(userId);
      // Refresh to get the new request
      await refreshConnections();
    } catch (err) {
      handleApiError(err, 'Failed to send connection request');
      throw err;
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await connectionsApi.acceptRequest(requestId);
      
      // Find the request and add to connections
      const request = receivedRequests.find(r => r.id === requestId);
      if (request) {
        const newConnection: Connection = {
          id: request.from.id,
          name: request.from.name,
          avatar: request.from.avatar,
          university: request.from.university,
          year: request.from.year,
          major: '',
          jobTitle: '',
          company: '',
          connectedDate: new Date().toISOString().split('T')[0],
        };
        
        setConnections(prev => [newConnection, ...prev]);
        setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (err) {
      handleApiError(err, 'Failed to accept request');
      throw err;
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await connectionsApi.rejectRequest(requestId);
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      handleApiError(err, 'Failed to reject request');
      throw err;
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      await connectionsApi.removeConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (err) {
      handleApiError(err, 'Failed to remove connection');
      throw err;
    }
  };

  return (
    <ConnectionsContext.Provider value={{
      connections,
      sentRequests,
      receivedRequests,
      isLoading,
      error,
      isConnected,
      hasPendingRequest,
      sendConnectionRequest,
      acceptRequest,
      rejectRequest,
      removeConnection,
      refreshConnections,
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
};

export const useConnections = () => {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used within ConnectionsProvider');
  }
  return context;
};
