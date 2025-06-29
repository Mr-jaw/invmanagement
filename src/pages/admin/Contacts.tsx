import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, Eye, Trash2, Clock, CheckCircle, MessageSquare, CheckSquare, Square, Filter, X, User, Calendar, Phone, MapPin, Tag, Reply, Archive, Flag } from 'lucide-react';
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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
      
      // Update selected contact if it's the one being marked as read
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, read: true, read_at: readAt });
      }

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
      
      // Update selected contact if it's the one being marked as unread
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, read: false, read_at: undefined });
      }
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
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      
      // Remove from selected contacts if it was selected
      setSelectedContacts(prev => prev.filter(contactId => contactId !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setDeletingContact(null);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Auto-mark as read when selecting a message
    if (!contact.read) {
      markAsRead(contact.id);
    }
  };

  const handleMessageUpdate = (updatedMessage: Contact) => {
    setContacts(contacts.map(c => 
      c.id === updatedMessage.id ? updatedMessage : c
    ));
    setModalMessage(updatedMessage);
    if (selectedContact?.id === updatedMessage.id) {
      setSelectedContact(updatedMessage);
    }
  };

  const handleMessageDelete = (messageId: string) => {
    setContacts(contacts.filter(c => c.id !== messageId));
    if (selectedContact?.id === messageId) {
      setSelectedContact(null);
    }
    setSelectedContacts(prev => prev.filter(id => id !== messageId));
    setShowMessageModal(false);
    setModalMessage(null);
  };

  const handleSelectContact = (contactId: string) => {
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
      
      // Clear selected contact if it was deleted
      if (selectedContact && selectedContacts.includes(selectedContact.id)) {
        setSelectedContact(null);
      }

      setSelectedContacts([]);
      console.log(`${selectedContacts.length} messages deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting contacts:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleReplyViaEmail = (contact: Contact) => {
    const subject = `Re: ${contact.subject}`;
    const body = `Hi ${contact.name},\n\nThank you for contacting us regarding "${contact.subject}".\n\n\n\nBest regards,\nLuxeShowcase Team`;
    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;
  };

  const getMessageCategory = (subject: string, message: string) => {
    const lowerSubject = subject.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    if (lowerSubject.includes('product') || lowerMessage.includes('product')) {
      return { category: 'Product Inquiry', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
    } else if (lowerSubject.includes('support') || lowerMessage.includes('help')) {
      return { category: 'Support Request', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
    } else if (lowerSubject.includes('complaint') || lowerMessage.includes('issue')) {
      return { category: 'Complaint', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
    } else if (lowerSubject.includes('feedback') || lowerMessage.includes('suggestion')) {
      return { category: 'Feedback', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    }
    return { category: 'General Inquiry', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
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

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAndSortedContacts.map((contact) => (
              <Card
                key={contact.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${contact.read ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'}`}
                onClick={() => handleContactClick(contact)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(contact.id);
                      }}
                      className="flex-shrink-0"
                    >
                      {selectedContacts.includes(contact.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">
                      {contact.name}
                    </h3>
                    {contact.read ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteContact(contact.id, e)}
                      loading={deletingContact === contact.id}
                      icon={Trash2}
                      className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                    >
                      <span className="sr-only">Delete message</span>
                    </Button>
                  </div>
                </div>
                {contact.read && contact.read_at && (
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                    Read {new Date(contact.read_at).toLocaleDateString()}
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  {contact.email}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {contact.subject}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {contact.message}
                </p>
              </Card>
            ))}
          </div>

          {filteredAndSortedContacts.length === 0 && (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No messages found
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Message Detail */}
        <div className="lg:col-span-2">
          {selectedContact ? (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Header with Contact Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {selectedContact.name}
                      </h2>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedContact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Received: {new Date(selectedContact.created_at).toLocaleString()}</span>
                        </div>
                        {selectedContact.read && selectedContact.read_at && (
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Read: {new Date(selectedContact.read_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedContact.read ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        <Mail className="h-4 w-4 mr-1" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Category */}
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMessageCategory(selectedContact.subject, selectedContact.message).color}`}>
                    {getMessageCategory(selectedContact.subject, selectedContact.message).category}
                  </span>
                </div>

                {/* Subject */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Subject
                  </h3>
                  <Card className="p-4 bg-gray-50 dark:bg-gray-700">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedContact.subject}
                    </p>
                  </Card>
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Message Content
                  </h3>
                  <Card className="p-6 bg-gray-50 dark:bg-gray-700 border-l-4 border-l-primary-500">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedContact.message}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Message Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Message Details</span>
                    </div>
                    <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <p>Message ID: {selectedContact.id.slice(0, 8)}...</p>
                      <p>Word Count: {selectedContact.message.split(' ').length} words</p>
                      <p>Character Count: {selectedContact.message.length} characters</p>
                    </div>
                  </Card>

                  <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-800 dark:text-purple-200">Sender Info</span>
                    </div>
                    <div className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                      <p>Name: {selectedContact.name}</p>
                      <p>Email: {selectedContact.email}</p>
                      <p>Domain: @{selectedContact.email.split('@')[1]}</p>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleReplyViaEmail(selectedContact)}
                        icon={Reply}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Reply via Email
                      </Button>
                      
                      <Button
                        onClick={() => selectedContact.read ? markAsUnread(selectedContact.id) : markAsRead(selectedContact.id)}
                        variant="outline"
                        icon={selectedContact.read ? Mail : CheckCircle}
                        className={selectedContact.read ? 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20' : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'}
                      >
                        Mark as {selectedContact.read ? 'Unread' : 'Read'}
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => deleteContact(selectedContact.id)}
                      loading={deletingContact === selectedContact.id}
                      variant="danger"
                      icon={Trash2}
                      className="sm:ml-3"
                    >
                      Delete Message
                    </Button>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {selectedContact.read 
                        ? 'This message has been read and is visible in your read messages list.'
                        : 'This message is unread and will appear in your unread messages list until marked as read.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a message to view details
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose a message from the list to view its complete details, sender information, and manage its status
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Message Details Modal */}
      <MessageDetailsModal
        isOpen={showMessageModal}
        onClose={() => {
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