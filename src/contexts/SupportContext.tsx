import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supportApi } from '@/api/support';
import { handleApiError } from '@/api/client';
import { useAuth } from './AuthContext';
import type { SupportTicketResponse, TicketResponseItem } from '@/api/types';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  universityId: string;
  universityName: string;
  subject: string;
  category: 'general' | 'technical' | 'academic' | 'events' | 'mentorship' | 'other';
  priority: 'low' | 'medium' | 'high';
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: 'alumni' | 'admin';
  message: string;
  createdAt: string;
}

interface SupportContextType {
  tickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'userName' | 'userEmail' | 'universityId' | 'universityName'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => Promise<void>;
  addResponse: (ticketId: string, message: string) => Promise<void>;
  getTicketsByUser: (userId: string) => SupportTicket[];
  getTicketsByUniversity: (universityId: string) => SupportTicket[];
  getTicketById: (ticketId: string) => SupportTicket | undefined;
  refreshTickets: () => Promise<void>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) throw new Error('useSupport must be used within SupportProvider');
  return context;
};

// Transform API response to frontend format
const transformTicket = (apiTicket: SupportTicketResponse, user: any): SupportTicket => ({
  id: apiTicket.id,
  userId: user?.id || '',
  userName: user?.name || 'Unknown',
  userEmail: user?.email || '',
  universityId: user?.universityId || '',
  universityName: user?.university || '',
  subject: apiTicket.subject,
  category: apiTicket.category as SupportTicket['category'],
  priority: apiTicket.priority as SupportTicket['priority'],
  description: apiTicket.description,
  status: apiTicket.status.replace('-', '') as SupportTicket['status'],
  createdAt: apiTicket.created_at,
  updatedAt: apiTicket.updated_at || apiTicket.created_at,
  responses: apiTicket.responses?.map((r: TicketResponseItem) => ({
    id: r.id,
    ticketId: apiTicket.id,
    userId: '',
    userName: r.responder_name,
    userRole: r.is_admin ? 'admin' : 'alumni',
    message: r.message,
    createdAt: r.created_at,
  })) || [],
});

export const SupportProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTickets = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getTickets({ page_size: 100 });
      setTickets(response.tickets.map(t => transformTicket(t, user)));
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load tickets when user is authenticated
  useEffect(() => {
    if (user) {
      refreshTickets();
    } else {
      setTickets([]);
    }
  }, [user, refreshTickets]);

  const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'userName' | 'userEmail' | 'universityId' | 'universityName'>) => {
    if (!user) return;
    
    try {
      const response = await supportApi.createTicket({
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
        description: ticketData.description,
      });
      
      setTickets(prev => [transformTicket(response, user), ...prev]);
    } catch (err) {
      handleApiError(err, 'Failed to create ticket');
      throw err;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => {
    try {
      await supportApi.closeTicket(ticketId);
      setTickets(prev => prev.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status,
            adminNotes: adminNotes || ticket.adminNotes,
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }));
    } catch (err) {
      handleApiError(err, 'Failed to update ticket status');
      throw err;
    }
  };

  const addResponse = async (ticketId: string, message: string) => {
    if (!user) return;

    try {
      await supportApi.addResponse(ticketId, message);

      const newResponse: TicketResponse = {
        id: `response_${Date.now()}`,
        ticketId,
        userId: user.id,
        userName: user.name,
        userRole: user.role || 'alumni',
        message,
        createdAt: new Date().toISOString(),
      };

      setTickets(prev => prev.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            responses: [...(ticket.responses || []), newResponse],
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }));
    } catch (err) {
      handleApiError(err, 'Failed to add response');
      throw err;
    }
  };

  const getTicketsByUser = (userId: string) => {
    return tickets.filter(ticket => ticket.userId === userId);
  };

  const getTicketsByUniversity = (universityId: string) => {
    return tickets.filter(ticket => ticket.universityId === universityId);
  };

  const getTicketById = (ticketId: string) => {
    return tickets.find(ticket => ticket.id === ticketId);
  };

  return (
    <SupportContext.Provider
      value={{
        tickets,
        isLoading,
        error,
        createTicket,
        updateTicketStatus,
        addResponse,
        getTicketsByUser,
        getTicketsByUniversity,
        getTicketById,
        refreshTickets,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};
