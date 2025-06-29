import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, Eye, Trash2, Clock, CheckCircle, MessageSquare, CheckSquare, Square, Filter, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MessageDetailsModal } from '../../components/admin/MessageDetailsModal';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface AdminAction {
  id: string;
  action_type: 'mark_read' | 'mark_unread' | 'delete_message';
  contact_id: string;
  admin_email: string;
  timestamp: string;
}

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [deletingContact, setDeletingContact] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (actionType: string, contactId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_actions')
        .insert([{
          action_type: actionType,
          contact_id: contactId,
          admin_email: user.email,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const readAt = new Date().toISOString();
      const { error } = await supabase
        .from('contacts')
        .update({ read: true, read_at: readAt })
        .eq('id', id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('mark_read', id);
      
      setContacts(contacts.map(c => 
        c.id === id ? { ...c, read: true, read_at: readAt } : c
      ));

      // Real-time status update
      console.log('Message marked as read successfully');
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ read: false, read_at: null })
        .eq('id', id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('mark_unread', id);
      
      setContacts(contacts.map(c => 
        c.id === id ? { ...c, read: false, read_at: undefined } : c
      ));
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  };

  const deleteContact = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent contact selection when clicking delete from list
    }
    
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
    
    setDeletingContact(id);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log admin action
      await logAdminAction('delete_message', id);
      
      setContacts(contacts.filter(c => c.id !== id));
      
      // Remove from selected contacts if it was selected
      setSelectedContacts(prev => prev.filter(contactId => contactId !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setDeletingContact(null);
    }
  };

  const handleContactClick = (contact: Contact) => {
    console.log('Contact clicked:', contact.name); // Debug log
    console.log('Opening modal for contact:', contact.id); // Additional debug
    
    // Set modal data and show modal
    setModalMessage(contact);
    setShowMessageModal(true);
    
    // Auto-mark as read when opening modal
    if (!contact.read) {
      markAsRead(contact.id);
    }
  };

  const handleMessageUpdate = (updatedMessage: Contact) => {
    setContacts(contacts.map(c => 
      c.id === updatedMessage.id ? updatedMessage : c
    ));
    setModalMessage(updatedMessage);
  };

  const handleMessageDelete = (messageId: string) => {
    setContacts(contacts.filter(c => c.id !== messageId));
    setSelectedContacts(prev => prev.filter(id => id !== messageId));
    setShowMessageModal(false);
    setModalMessage(null);
  };

  const handleSelectContact = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when selecting
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredAndSortedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredAndSortedContacts.map(contact => contact.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedContacts.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const readAt = new Date().toISOString();
      const { error } = await supabase
        .from('contacts')
        .update({ read: true, read_at: readAt })
        .in('id', selectedContacts);

      if (error) throw error;

      // Log admin actions for each contact
      for (const contactId of selectedContacts) {
        await logAdminAction('mark_read', contactId);
      }

      setContacts(contacts.map(c => 
        selectedContacts.includes(c.id) ? { ...c, read: true, read_at: readAt } : c
      ));

      setSelectedContacts([]);
      console.log(`${selectedContacts.length} messages marked as read successfully`);
    } catch (error) {
      console.error('Error bulk marking as read:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.length} messages? This action cannot be undone.`)) return;
    
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);

      if (error) throw error;

      // Log admin actions for each contact
      for (const contactId of selectedContacts) {
        await logAdminAction('delete_message', contactId);
      }

      setContacts(contacts.filter(c => !selectedContacts.includes(c.id)));

      setSelectedContacts([]);
      console.log(`${selectedContacts.length} messages deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting contacts:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'read' && contact.read) ||
      (filterStatus === 'unread' && !contact.read);

    return matchesSearch && matchesFilter;
  });

  const filteredAndSortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === 'status') {
      // Unread messages first
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
    }
    // Then by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = contacts.filter(c => !c.read).length;
  const readCount = contacts.filter(c => c.read).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Contact Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage customer inquiries and track message status
        </p>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Total Messages: {contacts.length}
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Unread: {unreadCount}
              </span>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Read: {readCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Single Column Layout - Messages List Only */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4 mb-4">
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread ({unreadCount})</option>
              <option value="read">Read ({readCount})</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedContacts.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedContacts.length} selected
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedContacts([])}
                  className="text-blue-600 dark:text-blue-400"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2">
                <Button
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  loading={bulkActionLoading}
                  icon={CheckCircle}
                  className="w-full"
                >
                  Mark All as Read
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleBulkDelete}
                  loading={bulkActionLoading}
                  icon={Trash2}
                  className="w-full"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* Select All */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {selectedContacts.length === filteredAndSortedContacts.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Select All</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAndSortedContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-[1.01] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg ${
                contact.read ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'
              }`}
              onClick={() => handleContactClick(contact)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={(e) => handleSelectContact(contact.id, e)}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {selectedContacts.includes(contact.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contact.name}
                      </h3>
                      {contact.read ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {contact.email}
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
                      {contact.subject}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {contact.message}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <p>{new Date(contact.created_at).toLocaleDateString()}</p>
                    <p>{new Date(contact.created_at).toLocaleTimeString()}</p>
                    {contact.read && contact.read_at && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Read {new Date(contact.read_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteContact(contact.id, e)}
                    loading={deletingContact === contact.id}
                    icon={Trash2}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="sr-only">Delete message</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedContacts.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No messages found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Try adjusting your search terms' : 'Messages will appear here when customers contact you'}
            </p>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      <MessageDetailsModal
        isOpen={showMessageModal}
        onClose={() => {
          console.log('Closing modal'); // Debug log
          setShowMessageModal(false);
          setModalMessage(null);
        }}
        message={modalMessage}
        onMessageUpdate={handleMessageUpdate}
        onMessageDelete={handleMessageDelete}
      />
    </div>
  );
};